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

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    // Get current user from session
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const currentUserId = session.user.id;

    // Check if current user has blocked target user
    const blockedByMe = await db.prepare(
      "SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?"
    ).bind(currentUserId, targetUserId).first();

    // Check if target user has blocked current user
    const blockedByThem = await db.prepare(
      "SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?"
    ).bind(targetUserId, currentUserId).first();

    return NextResponse.json({ 
      success: true, 
      blockedByMe: !!blockedByMe,
      blockedByThem: !!blockedByThem,
      canInteract: !blockedByMe && !blockedByThem
    });
  } catch (error) {
    console.error("Check block status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
