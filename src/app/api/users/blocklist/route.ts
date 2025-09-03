import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get current user from session
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get database user ID from email
    const userResult = await db.prepare('SELECT id FROM users WHERE email = ?').bind(session.user.email).first();
    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const currentUserId = userResult.id;

    // Get blocked users with their details
    const blockedUsers = await db.prepare(`
      SELECT 
        ub.id as block_id,
        ub.blocked_id,
        ub.created_at,
        ub.reason,
        u.username,
        u.email,
        u.image,
        u.verified,
        u.thumbs_up as thumbsUp,
        u.deals
      FROM user_blocks ub
      JOIN users u ON ub.blocked_id = u.id
      WHERE ub.blocker_id = ?
      ORDER BY ub.created_at DESC
    `).bind(currentUserId).all();

    return NextResponse.json({ 
      success: true, 
      blockedUsers: blockedUsers.results || [] 
    });
  } catch (error) {
    console.error("Get blocklist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
