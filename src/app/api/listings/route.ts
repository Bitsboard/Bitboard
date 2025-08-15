// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '../../shims/async_hooks';
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
                         boosted_until AS boostedUntil,
                         created_at AS createdAt
                  FROM listings
                  ORDER BY id DESC
                  LIMIT ? OFFSET ?`)
        .bind(limit, offset)
        .all();
      results = rich.results ?? [];
    } catch {
      // Fallback to legacy minimal schema
      const minimal = await db
        .prepare(`SELECT id,
                         title,
                         price_sat AS priceSat,
                         created_at AS createdAt
                  FROM listings
                  ORDER BY id DESC
                  LIMIT ? OFFSET ?`)
        .bind(limit, offset)
        .all();
      results = minimal.results ?? [];
    }

    const totalRow = await db.prepare("SELECT COUNT(*) AS c FROM listings").all();
    const total = (totalRow.results?.[0] as any)?.c ?? 0;

    return NextResponse.json({ listings: results, total });
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
    const boostedUntil = body?.boosted_until ?? body?.boostedUntil;

    if (!title || !Number.isFinite(priceSat) || priceSat < 0) {
      return NextResponse.json({ error: "title (string) and price_sat (number) required" }, { status: 400 });
    }

    // Try extended schema insert; fall back to legacy minimal schema
    let res: any;
    try {
      res = await db
        .prepare(`INSERT INTO listings (
          title, description, category, ad_type, location, lat, lng, image_url, price_sat, boosted_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
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
          boostedUntil ?? null
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
