import '../../../shims/async_hooks';
import { NextRequest, NextResponse } from "next/server";
import { listingsQuerySchema, listingCreateSchema } from "@/lib/validation/listings";
import { handleApiError, createValidationError, createNotFoundError } from "@/lib/api/errors";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
    }

    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    if (!db) return NextResponse.json({ error: "no_db_binding" }, { status: 200 });

    // Validate query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = listingsQuerySchema.parse(queryParams);

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

    // Build optional filters
    const whereClause: string[] = [];
    const binds: any[] = [];

    if (validatedQuery.q) {
      whereClause.push("(l.title LIKE ? OR l.description LIKE ?)");
      binds.push(`%${validatedQuery.q}%`, `%${validatedQuery.q}%`);
    }

    if (validatedQuery.category && validatedQuery.category.toLowerCase() !== "featured") {
      whereClause.push("(l.category = ?)");
      binds.push(validatedQuery.category);
    }

    if (validatedQuery.adType) {
      whereClause.push("(l.ad_type = ?)");
      binds.push(validatedQuery.adType);
    }

    if (validatedQuery.minPrice !== undefined) {
      whereClause.push("(l.price_sat >= ?)");
      binds.push(Math.round(validatedQuery.minPrice));
    }

    if (validatedQuery.maxPrice !== undefined) {
      whereClause.push("(l.price_sat <= ?)");
      binds.push(Math.round(validatedQuery.maxPrice));
    }

    // Geospatial radius filter
    if (validatedQuery.lat !== undefined && validatedQuery.lng !== undefined && validatedQuery.radiusKm !== undefined) {
      const effectiveRadiusKm = validatedQuery.radiusKm === 0 ? 100000 : validatedQuery.radiusKm;

      if (effectiveRadiusKm < 900000) {
        const R_KM_PER_DEG = 111.32;
        const deltaLat = effectiveRadiusKm / R_KM_PER_DEG;
        const rad = (validatedQuery.lat * Math.PI) / 180;
        const cosLat = Math.cos(rad);
        const safeCos = Math.max(0.01, Math.abs(cosLat));
        const deltaLng = effectiveRadiusKm / (R_KM_PER_DEG * safeCos);

        whereClause.push("(l.lat BETWEEN ? AND ?)");
        binds.push(validatedQuery.lat - deltaLat, validatedQuery.lat + deltaLat);
        whereClause.push("(l.lng BETWEEN ? AND ?)");
        binds.push(validatedQuery.lng - deltaLng, validatedQuery.lng + deltaLng);
      }
    }

    const whereClauseStr = whereClause.length ? `WHERE ${whereClause.join(" AND ")}` : "";

    // Build ORDER BY clause
    let orderClause = `ORDER BY ${validatedQuery.sortBy === 'price' ? 'l.price_sat' : 'l.created_at'} ${validatedQuery.sortOrder}`;
    let orderBinds: any[] = [];

    if (validatedQuery.sortBy === 'distance' && validatedQuery.lat !== undefined && validatedQuery.lng !== undefined) {
      orderClause = `ORDER BY ((l.lat - ?)*(l.lat - ?)+(l.lng - ?)*(l.lng - ?)) ASC`;
      orderBinds = [validatedQuery.lat, validatedQuery.lat, validatedQuery.lng, validatedQuery.lng];
    }

    // Execute query
    let results: any[] = [];
    try {
      // First, let's diagnose what's in the database
      console.log('🔍 Listings API: Checking database state...');
      
      const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').all();
      const listingCount = await db.prepare('SELECT COUNT(*) as count FROM listings').all();
      const sampleUsers = await db.prepare('SELECT id, email, username FROM users LIMIT 3').all();
      const sampleListings = await db.prepare('SELECT id, title, posted_by FROM listings LIMIT 3').all();
      
      console.log('🔍 Listings API: Database state:', {
        userCount: userCount.results?.[0]?.count,
        listingCount: listingCount.results?.[0]?.count,
        sampleUsers: sampleUsers.results,
        sampleListings: sampleListings.results
      });
      
      const rich = await db
        .prepare(`SELECT l.id,
                         l.title,
                         l.description,
                         l.category,
                         l.ad_type AS adType,
                         l.location,
                         l.lat,
                         l.lng,
                         l.image_url AS imageUrl,
                         l.price_sat AS priceSat,
                         u.username AS postedBy,
                         u.rating AS userRating,
                         u.deals AS userDeals,
                         u.verified AS userVerified,
                         l.boosted_until AS boostedUntil,
                         l.created_at AS createdAt
                  FROM listings l
                  JOIN users u ON l.posted_by = u.id
                  ${whereClauseStr}
                  ${orderClause}
                  LIMIT ? OFFSET ?`)
        .bind(...binds, ...orderBinds, validatedQuery.limit, validatedQuery.offset)
        .all();
      results = rich.results ?? [];
      console.log('🔍 Listings API: Rich query returned', results.length, 'results');
    } catch (error) {
      console.log('🔍 Listings API: Rich query failed:', error);
      // Fallback to minimal schema
      const minimal = await db
        .prepare(`SELECT l.id,
                         l.title,
                         l.price_sat AS priceSat,
                         l.created_at AS createdAt,
                         u.username AS postedBy,
                         u.rating AS userRating,
                         u.deals AS userDeals,
                         u.verified AS userVerified
                  FROM listings l
                  JOIN users u ON l.posted_by = u.id
                  ${whereClauseStr}
                  ORDER BY ${validatedQuery.sortBy === 'price' ? 'l.price_sat' : 'l.created_at'} ${validatedQuery.sortOrder}
                  LIMIT ? OFFSET ?`)
        .bind(...binds, validatedQuery.limit, validatedQuery.offset)
        .all();
      results = minimal.results ?? [];
      console.log('🔍 Listings API: Minimal query returned', results.length, 'results');
    }
    
    // If still no results, try a basic listings query without JOIN
    if (results.length === 0) {
      console.log('🔍 Listings API: Trying basic listings query without JOIN...');
      try {
        const basic = await db
          .prepare(`SELECT l.id,
                           l.title,
                           l.description,
                           l.category,
                           l.ad_type AS adType,
                           l.location,
                           l.lat,
                           l.lng,
                           l.image_url AS imageUrl,
                           l.price_sat AS priceSat,
                           l.posted_by AS postedBy,
                           l.boosted_until AS boostedUntil,
                           l.created_at AS createdAt
                    FROM listings l
                    ${whereClauseStr}
                    ORDER BY ${validatedQuery.sortBy === 'price' ? 'l.price_sat' : 'l.created_at'} ${validatedQuery.sortOrder}
                    LIMIT ? OFFSET ?`)
          .bind(...binds, validatedQuery.limit, validatedQuery.offset)
          .all();
        results = basic.results ?? [];
        console.log('🔍 Listings API: Basic query returned', results.length, 'results');
      } catch (basicError) {
        console.log('🔍 Listings API: Basic query also failed:', basicError);
      }
    }

    // Get total count
    let totalRow: any;
    try {
      totalRow = await db
        .prepare(`SELECT COUNT(*) AS c FROM listings l JOIN users u ON l.posted_by = u.id ${whereClauseStr}`)
        .bind(...binds)
        .all();
    } catch {
      // Fallback count query
      totalRow = await db
        .prepare(`SELECT COUNT(*) AS c FROM listings l ${whereClauseStr}`)
        .bind(...binds)
        .all();
    }
    const total = (totalRow.results?.[0] as any)?.c ?? 0;

    // Staging/demo: diversify images if missing
    const stock = [
      '1518770660439-4636190af475', '1542751371-adc38448a05e',
      '1518779578993-ec3579fee39f', '1512496015851-a90fb38ba796',
      '1517816743773-6e0fd518b4a6', '1517245386807-bb43f82c33c4',
      '1541532713592-79a0317b6b77', '1555617117-08d3a8fef16c'
    ];

    const listings = results.map((r: any, i: number) => {
      // Debug: Log the raw rating values from database
      if (i < 3) { // Only log first 3 to avoid spam
        console.log(`API: Listing ${r.id} raw rating from DB:`, {
          id: r.id,
          userRating: r.userRating,
          userRatingType: typeof r.userRating,
          postedBy: r.postedBy
        });
      }
      
      return {
        ...r,
        imageUrl: r.imageUrl && r.imageUrl.trim() ? r.imageUrl :
          `https://images.unsplash.com/photo-${stock[i % stock.length]}?q=80&w=1600&auto=format&fit=crop`,
      };
    });

    return NextResponse.json({
      success: true,
      data: { listings, total },
      pagination: {
        page: Math.floor(validatedQuery.offset / validatedQuery.limit) + 1,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit)
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
    }

    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    if (!db) return NextResponse.json({ error: "no_db_binding" }, { status: 200 });

    // Validate request body
    const body = await req.json();
    const validatedData = listingCreateSchema.parse(body);

    // Get current user if signed in
    let currentUserId: string | null = null;
    try {
      const cookieHeader = req.headers.get('cookie') || '';
      const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1] || '';
      if (token) {
        const { getAuthSecret, verifyJwtHS256 } = await import('@/lib/auth');
        const payload = await verifyJwtHS256(token, getAuthSecret());
        const email = (payload as any)?.email || '';
        if (email) {
          await db.prepare(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            sso TEXT,
            verified INTEGER DEFAULT 0,
            is_admin INTEGER DEFAULT 0,
            banned INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            image TEXT
          )`).run();
          const u = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all();
          currentUserId = (u.results?.[0] as any)?.id ?? null;
        }
      }
    } catch { }

    // Ensure extended columns exist
    try {
      await db.prepare('ALTER TABLE listings ADD COLUMN posted_by TEXT').run();
    } catch { }

    // Insert listing
    let res: any;
    try {
      res = await db
        .prepare(`INSERT INTO listings (
          title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          validatedData.title.slice(0, 120),
          validatedData.description || "",
          validatedData.category,
          validatedData.adType,
          validatedData.location,
          validatedData.lat,
          validatedData.lng,
          validatedData.imageUrl || "",
          Math.round(validatedData.priceSat),
          currentUserId || ""
        )
        .run();
    } catch {
      // Fallback to minimal schema
      res = await db
        .prepare("INSERT INTO listings (title, price_sat) VALUES (?, ?)")
        .bind(validatedData.title.slice(0, 120), Math.round(validatedData.priceSat))
        .run();
    }

    const id = (res as any).meta?.last_row_id ?? null;
    if (!id) {
      throw createValidationError("Failed to create listing");
    }

    // Fetch created listing
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
    if (!listing) {
      throw createNotFoundError("Created listing not found");
    }

    return NextResponse.json({
      success: true,
      data: { listing },
      message: "Listing created successfully"
    });

  } catch (error) {
    return handleApiError(error);
  }
}
