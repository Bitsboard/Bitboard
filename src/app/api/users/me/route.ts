import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: Request) {
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

    // Get user information from database
    const user = await db
      .prepare(`
        SELECT id, email, username, has_chosen_username, image, thumbs_up, deals, verified, is_admin
        FROM users 
        WHERE email = ?
      `)
      .bind(session.user.email)
      .first();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        handle: user.username,
        hasChosenUsername: Boolean(user.has_chosen_username),
        image: user.image,
        thumbsUp: user.thumbs_up,
        deals: user.deals,
        verified: Boolean(user.verified),
        isAdmin: Boolean(user.is_admin)
      }
    });

  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to get user information" },
      { status: 500 }
    );
  }
}
