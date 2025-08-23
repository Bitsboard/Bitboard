import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { validateUsername } from "@/lib/utils";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { username } = await req.json() as { username?: string };
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Validate username format
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error || "Invalid username",
        available: false 
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

    const available = !existingUser;

    return NextResponse.json({ 
      available,
      username: username.toLowerCase()
    });

  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
