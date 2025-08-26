import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    console.log('User API called for username:', params.username);
    
    // Try to get Cloudflare context
    let db: any = null;
    try {
      const mod = await import("@cloudflare/next-on-pages");
      if (mod && typeof mod.getRequestContext === "function") {
        const env = mod.getRequestContext().env as { DB?: any };
        db = env.DB;
      }
    } catch (error) {
      console.log('Cloudflare adapter not available, using fallback');
    }

    // If no database binding, return fallback for local development
    if (!db) {
      console.log('Local development mode, returning no_db_binding error');
      return NextResponse.json({ error: "no_db_binding" }, { status: 200 });
    }

    const username = params.username;
    if (!username) {
      return NextResponse.json({ error: "username_required" }, { status: 400 });
    }

    // Get user profile
    const userResult = await db.prepare(`
      SELECT 
        id, 
        username, 
        verified, 
        created_at, 
        image,
        email,
        rating,
        deals,
        last_active
      FROM users 
      WHERE username = ?
    `).bind(username).all();

    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ 
        error: "user_not_found",
        message: "User not found" 
      }, { status: 404 });
    }

    const user = userResult.results[0];

    // Get listing count for this user
    const countResult = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM listings 
      WHERE posted_by = ? AND status = 'active'
    `).bind(user.id).all();

    const listingCount = countResult.results?.[0]?.count || 0;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        verified: Boolean(user.verified),
        registeredAt: user.created_at,
        profilePhoto: user.image,
        rating: user.rating || 0,
        deals: user.deals || 0,
        lastActive: user.last_active || user.created_at
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
