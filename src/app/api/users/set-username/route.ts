import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";
import { validateUsername } from "@/lib/utils";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json() as { username?: string };
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Validate username format
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error || "Invalid username"
      }, { status: 400 });
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Check if username already exists
    const existingUser = await db
      .prepare("SELECT 1 FROM users WHERE username = ?")
      .bind(username.toLowerCase())
      .first();

    if (existingUser) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    // Update user's username and mark as having chosen
    await db
      .prepare(`
        UPDATE users 
        SET username = ?, has_chosen_username = 1 
        WHERE email = ?
      `)
      .bind(username.toLowerCase(), session.user.email)
      .run();

    return NextResponse.json({ 
      success: true,
      username: username.toLowerCase(),
      message: "Username set successfully"
    });

  } catch (error) {
    console.error("Set username error:", error);
    return NextResponse.json(
      { error: "Failed to set username" },
      { status: 500 }
    );
  }
}
