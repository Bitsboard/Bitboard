import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { targetUserId, action, reason } = await req.json() as { targetUserId?: string; action?: string; reason?: string };

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action !== "block" && action !== "unblock") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    if (action === "block") {
      // Check if already blocked
      const existingBlock = await db.prepare(
        "SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?"
      ).bind(currentUserId, targetUserId).first();

      if (existingBlock) {
        return NextResponse.json({ error: "User already blocked" }, { status: 400 });
      }

      // Block the user
      await db.prepare(
        "INSERT INTO user_blocks (blocker_id, blocked_id, reason) VALUES (?, ?, ?)"
      ).bind(currentUserId, targetUserId, reason || null).run();

      return NextResponse.json({ 
        success: true, 
        message: "User blocked successfully" 
      });
    } else {
      // Unblock the user
      const result = await db.prepare(
        "DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?"
      ).bind(currentUserId, targetUserId).run();

      if (result.meta.changes === 0) {
        return NextResponse.json({ error: "User not blocked" }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "User unblocked successfully" 
      });
    }
  } catch (error) {
    console.error("Block/Unblock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
