export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Try to get userEmail from query parameters first, then from session
    const url = new URL(request.url);
    const userEmailParam = url.searchParams.get('userEmail');
    
    let userEmail: string;
    if (userEmailParam) {
      userEmail = userEmailParam;
    } else {
      const session = await getSessionFromRequest(request);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userEmail = session.user.email;
    }

    // Get database connection
    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get user ID from email
    const userResult = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(userEmail)
      .first();

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.id;

    // Get user's notifications - only show notifications sent after user account was created
    const notifications = await db.prepare(`
      SELECT 
        un.id as user_notification_id,
        un.read_at,
        un.created_at as received_at,
        sn.id as notification_id,
        sn.title,
        sn.message,
        sn.icon,
        sn.action_url,
        sn.target_group
      FROM user_notifications un
      JOIN system_notifications sn ON un.notification_id = sn.id
      JOIN users u ON un.user_id = u.id
      WHERE un.user_id = ? AND sn.status = 'active' AND sn.created_at >= u.created_at
      ORDER BY un.created_at DESC
      LIMIT 50
    `).bind(userId).all();

    return NextResponse.json({
      success: true,
      notifications: notifications.results || []
    });

  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, notificationId } = await request.json() as { 
      action: 'mark_read' | 'mark_all_read'; 
      notificationId?: string 
    };

    // Get database connection
    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    if (action === 'mark_read' && notificationId) {
      // Mark specific notification as read
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = ? 
        WHERE user_id = ? AND notification_id = ?
      `).bind(
        Math.floor(Date.now() / 1000),
        session.user.id,
        notificationId
      ).run();
    } else if (action === 'mark_all_read') {
      // Mark all notifications as read
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = ? 
        WHERE user_id = ? AND read_at IS NULL
      `).bind(
        Math.floor(Date.now() / 1000),
        session.user.id
      ).run();
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}