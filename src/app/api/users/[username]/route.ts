import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
    }
    
    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ error: "no_db_binding" }, { status: 200 });
    }

    const username = params.username;
    if (!username) {
      return NextResponse.json({ error: "username_required" }, { status: 400 });
    }

    // Ensure users table exists
    try {
      await db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        sso TEXT,
        verified INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        image TEXT
      )`).run();
    } catch (error) {
      console.error('Failed to create users table:', error);
    }

    // Get user profile
    const userResult = await db.prepare(`
      SELECT 
        id, 
        username, 
        verified, 
        created_at, 
        image,
        email
      FROM users 
      WHERE username = ?
    `).bind(username).all();

    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ 
        error: "user_not_found",
        message: "User not found" 
      }, { status: 404 });
    }

    const user = userResult.results[0] as any;

    // Get listing count for this user
    const countResult = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM listings 
      WHERE posted_by = ?
    `).bind(user.id).all();

    const listingCount = countResult.results?.[0]?.count || 0;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        verified: Boolean(user.verified),
        registeredAt: user.created_at,
        profilePhoto: user.image
      },
      listingCount
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: "internal_error",
      message: "Failed to fetch user profile" 
    }, { status: 500 });
  }
}
