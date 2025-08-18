import '../../../shims/async_hooks';
import { NextResponse } from "next/server";
// Avoid hard crashes if the adapter is missing in some envs

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
    }
    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    if (!db) return NextResponse.json({ error: "no_db_binding" }, { status: 200 });

    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50);
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
    const q = (url.searchParams.get("q") || "").trim();
    const category = (url.searchParams.get("category") || "").trim();
    const adTypeParam = (url.searchParams.get("adType") || "").trim().toLowerCase();
    const adType = adTypeParam === "sell" || adTypeParam === "want" ? adTypeParam : "";
    const minPriceRaw = url.searchParams.get("minPrice");
    const maxPriceRaw = url.searchParams.get("maxPrice");
    const minPrice = minPriceRaw != null && minPriceRaw !== "" ? Number(minPriceRaw) : null;
    const maxPrice = maxPriceRaw != null && maxPriceRaw !== "" ? Number(maxPriceRaw) : null;
    const sortByParam = (url.searchParams.get("sortBy") || "date").trim(); // 'date' | 'price' | 'distance'
    const sortOrderParam = (url.searchParams.get("sortOrder") || "desc").trim().toLowerCase(); // 'asc' | 'desc'
    const centerLat = Number(url.searchParams.get("lat") ?? "");
    const centerLng = Number(url.searchParams.get("lng") ?? "");
    const hasCenter = Number.isFinite(centerLat) && Number.isFinite(centerLng);
    const radiusKmParam = url.searchParams.get("radiusKm");
    const radiusKm = radiusKmParam != null && radiusKmParam !== "" ? Number(radiusKmParam) : null;
    const hasRadius = radiusKm != null && Number.isFinite(radiusKm) && (radiusKm as number) > 0;

    // Ensure minimal schema exists so queries don't explode on fresh DBs
    try {
      await db
        .prepare(`CREATE TABLE IF NOT EXISTS listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          price_sat INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        )`)
        .run();
    } catch { }

    // Build optional filters (rich schema vs minimal fallback)
    const whereRich: string[] = [];
    const bindsRich: any[] = [];
    const whereMinimal: string[] = [];
    const bindsMinimal: any[] = [];

    if (q) {
      whereRich.push("(title LIKE ? OR description LIKE ?)");
      bindsRich.push(`%${q}%`, `%${q}%`);
      whereMinimal.push("(title LIKE ?)");
      bindsMinimal.push(`%${q}%`);
    }
    if (category && category.toLowerCase() !== "featured") {
      whereRich.push("(category = ?)");
      bindsRich.push(category);
    }
    if (adType) {
      whereRich.push("(ad_type = ?)");
      bindsRich.push(adType);
    }
    if (minPrice !== null && Number.isFinite(minPrice)) {
      whereRich.push("(price_sat >= ?)");
      bindsRich.push(Math.round(minPrice));
      whereMinimal.push("(price_sat >= ?)");
      bindsMinimal.push(Math.round(minPrice));
    }
    if (maxPrice !== null && Number.isFinite(maxPrice)) {
      whereRich.push("(price_sat <= ?)");
      bindsRich.push(Math.round(maxPrice));
      whereMinimal.push("(price_sat <= ?)");
      bindsMinimal.push(Math.round(maxPrice));
    }

    // Optional geospatial radius filter via bounding box (SQLite-friendly)
    // Skip if radius is extremely large (used for national/global) or center missing
    if (hasCenter && hasRadius && (radiusKm as number) < 900000) {
      const R_KM_PER_DEG = 111.32; // Approx conversion
      const deltaLat = (radiusKm as number) / R_KM_PER_DEG;
      const rad = (centerLat * Math.PI) / 180;
      const cosLat = Math.cos(rad);
      const safeCos = Math.max(0.01, Math.abs(cosLat));
      const deltaLng = (radiusKm as number) / (R_KM_PER_DEG * safeCos);
      const minLat = centerLat - deltaLat;
      const maxLat = centerLat + deltaLat;
      const minLng = centerLng - deltaLng;
      const maxLng = centerLng + deltaLng;
      whereRich.push("(lat BETWEEN ? AND ?)");
      bindsRich.push(minLat, maxLat);
      whereRich.push("(lng BETWEEN ? AND ?)");
      bindsRich.push(minLng, maxLng);
    }

    const whereClauseRich = whereRich.length ? `WHERE ${whereRich.join(" AND ")}` : "";
    const whereClauseMinimal = whereMinimal.length ? `WHERE ${whereMinimal.join(" AND ")}` : "";

    // ORDER BY whitelist (rich schema can sort by distance)
    const sortField = sortByParam === 'price' ? 'price_sat' : 'created_at';
    const sortOrder = sortOrderParam === 'asc' ? 'ASC' : 'DESC';
    let orderClause = `ORDER BY ${sortField} ${sortOrder}`;
    let orderBinds: any[] = [];
    if (sortByParam === 'distance' && hasCenter) {
      orderClause = `ORDER BY ((lat - ?)*(lat - ?)+(lng - ?)*(lng - ?)) ASC`;
      orderBinds = [centerLat, centerLat, centerLng, centerLng];
    }

    let results: any[] = [];
    try {
      // Try rich schema first
      const rich = await db
        .prepare(`SELECT id,
                         title,
                         description,
                         category,
                         ad_type AS adType,
                         location,
                         lat,
                         lng,
                         image_url AS imageUrl,
                         price_sat AS priceSat,
                         posted_by AS postedBy,
                         boosted_until AS boostedUntil,
                         created_at AS createdAt
                  FROM listings
                  ${whereClauseRich}
                  ${orderClause}
                  LIMIT ? OFFSET ?`)
        .bind(...bindsRich, ...orderBinds, limit, offset)
        .all();
      results = rich.results ?? [];
    } catch {
      // Fallback to legacy minimal schema (no lat/lng -> ignore distance sort)
      const minimal = await db
        .prepare(`SELECT id,
                         title,
                         price_sat AS priceSat,
                         created_at AS createdAt
                  FROM listings
                  ${whereClauseMinimal}
                  ORDER BY ${sortField} ${sortOrder}
                  LIMIT ? OFFSET ?`)
        .bind(...bindsMinimal, limit, offset)
        .all();
      results = minimal.results ?? [];
    }

    // Compute total with same filters
    let totalRow: any;
    try {
      totalRow = await db
        .prepare(`SELECT COUNT(*) AS c FROM listings ${whereClauseRich}`)
        .bind(...bindsRich)
        .all();
    } catch {
      totalRow = await db
        .prepare(`SELECT COUNT(*) AS c FROM listings ${whereClauseMinimal}`)
        .bind(...bindsMinimal)
        .all();
    }
    const total = (totalRow.results?.[0] as any)?.c ?? 0;

    // Staging/demo: diversify images and sellers if missing
    const stock = [
      '1518770660439-4636190af475', // robot
      '1542751371-adc38448a05e',
      '1518779578993-ec3579fee39f',
      '1512496015851-a90fb38ba796',
      '1517816743773-6e0fd518b4a6',
      '1517245386807-bb43f82c33c4',
      '1541532713592-79a0317b6b77',
      '1555617117-08d3a8fef16c'
    ];
    const sellers = ['demo_seller', 'satoshi', 'luna', 'rob', 'mika', 'arya', 'nova', 'kai'];
    const listings = results.map((r: any, i: number) => ({
      ...r,
      imageUrl: r.imageUrl && r.imageUrl.trim() ? r.imageUrl : `https://images.unsplash.com/photo-${stock[i % stock.length]}?q=80&w=1600&auto=format&fit=crop`,
      postedBy: r.postedBy && r.postedBy.trim() ? r.postedBy : sellers[i % sellers.length],
    }));

    return NextResponse.json({ listings, total });
  } catch (err: any) {
    const message = err?.message ?? "Internal Server Error";
    return NextResponse.json({ error: message, hint: "Ensure D1 binding 'DB' is set and schema exists" }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== "function") {
    return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
  }
  const db = mod.getRequestContext().env.DB as D1Database;
  try {
    const body = (await req.json()) as {
      title?: unknown;
      description?: unknown;
      category?: unknown;
      ad_type?: unknown;
      adType?: unknown;
      location?: unknown;
      lat?: unknown;
      lng?: unknown;
      image_url?: unknown;
      imageUrl?: unknown;
      price_sat?: unknown;
      priceSat?: unknown;
      posted_by?: unknown;
      postedBy?: unknown;
      boosted_until?: unknown;
      boostedUntil?: unknown;
    };
    const title = (body?.title ?? "").toString().trim();
    const priceSat = Number(body?.price_sat ?? body?.priceSat);
    const description = (body?.description ?? "").toString();
    const category = (body?.category ?? "Misc").toString();
    const adType = (body?.ad_type ?? body?.adType ?? "sell").toString();
    const location = (body?.location ?? "").toString();
    const lat = Number(body?.lat ?? 0);
    const lng = Number(body?.lng ?? 0);
    const imageUrl = (body?.image_url ?? body?.imageUrl ?? "").toString();
    const postedBy = (body?.posted_by ?? body?.postedBy ?? "").toString();
    const boostedUntil = body?.boosted_until ?? body?.boostedUntil;

    if (!title || !Number.isFinite(priceSat) || priceSat < 0) {
      return NextResponse.json({ error: "title (string) and price_sat (number) required" }, { status: 400 });
    }

    // Try extended schema insert; fall back to legacy minimal schema
    let res: any;
    try {
      res = await db
        .prepare(`INSERT INTO listings (
          title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          title.slice(0, 120),
          description,
          category,
          adType,
          location,
          Number.isFinite(lat) ? lat : 0,
          Number.isFinite(lng) ? lng : 0,
          imageUrl,
          Math.round(priceSat),
          postedBy,
          (boostedUntil as any) ?? null
        )
        .run();
    } catch {
      res = await db
        .prepare("INSERT INTO listings (title, price_sat) VALUES (?, ?)")
        .bind(title.slice(0, 120), Math.round(priceSat))
        .run();
    }

    const id = (res as any).meta?.last_row_id ?? null;

    const row = await db
      .prepare(`SELECT id,
                       title,
                       description,
                       category,
                       ad_type AS adType,
                       location,
                       lat,
                       lng,
                       image_url AS imageUrl,
                       price_sat AS priceSat,
                       posted_by AS postedBy,
                       boosted_until AS boostedUntil,
                       created_at AS createdAt
                FROM listings WHERE id = ?`)
      .bind(id)
      .all();

    const listing = row.results?.[0] ?? null;
    return NextResponse.json({ listing, ok: true });
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
}
