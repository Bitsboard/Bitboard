import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Reset the current user's thumbs_up to 0
    const result = await db
      .prepare("UPDATE users SET thumbs_up = 0 WHERE email = ?")
      .bind(session.user.email)
      .run();

    if (result.meta.changes === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Reputation reset to 0",
      changes: result.meta.changes
    });

  } catch (error) {
    console.error("Reset reputation error:", error);
    return NextResponse.json(
      { error: "Failed to reset reputation" },
      { status: 500 }
    );
  }
}
