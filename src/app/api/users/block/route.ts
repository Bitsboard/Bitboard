import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/cf";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
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

    const { targetUserId, action, reason } = await req.json();

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action !== "block" && action !== "unblock") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get current user from session
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const currentUserId = session.user.id;

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

      if (result.changes === 0) {
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
