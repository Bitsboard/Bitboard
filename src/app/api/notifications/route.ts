export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get database connection
    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get user's notifications
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
      WHERE un.user_id = ? AND sn.status = 'active'
      ORDER BY un.created_at DESC
      LIMIT 50
    `).bind(session.user.id).all();

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