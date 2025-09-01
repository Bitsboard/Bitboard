import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
    }

    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get current user from session
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const currentUserId = session.user.id;

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
        u.thumbs_up,
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
