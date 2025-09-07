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
        sn.target_group,
        sn.priority
      FROM user_notifications un
      JOIN system_notifications sn ON un.notification_id = sn.id
      JOIN users u ON un.user_id = u.id
      WHERE un.user_id = ? AND sn.status = 'active' AND sn.created_at >= u.created_at
      ORDER BY un.read_at IS NULL DESC, un.created_at DESC
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

    const { action, notificationId, userEmail } = await request.json() as { 
      action: 'mark_read' | 'mark_all_read' | 'delete' | 'mark_unread' | 'delete_by_system_id' | 'mark_read_by_system_id'; 
      notificationId?: string;
      userEmail?: string;
    };

    // Get database connection
    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    if (action === 'mark_read' && notificationId) {
      // Mark specific notification as read using user_notification_id
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = ? 
        WHERE id = ?
      `).bind(
        Math.floor(Date.now() / 1000),
        notificationId
      ).run();
    } else if (action === 'mark_all_read') {
      // Get user ID from email first
      const userResult = await db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(session.user.email)
        .first();

      if (!userResult) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userId = userResult.id;

      // Mark all notifications as read
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = ? 
        WHERE user_id = ? AND read_at IS NULL
      `).bind(
        Math.floor(Date.now() / 1000),
        userId
      ).run();
    } else if (action === 'delete' && notificationId) {
      // Delete specific notification by user_notification_id
      await db.prepare(`
        DELETE FROM user_notifications 
        WHERE id = ?
      `).bind(notificationId).run();
    } else if (action === 'delete_by_system_id' && notificationId && userEmail) {
      // Delete old notifications by system notification ID and user email
      // First get user ID
      const userResult = await db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(userEmail)
        .first();

      if (!userResult) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userId = userResult.id;
      
      // Delete from user_notifications using system notification ID and user ID
      await db.prepare(`
        DELETE FROM user_notifications 
        WHERE notification_id = ? AND user_id = ?
      `).bind(notificationId, userId).run();
    } else if (action === 'mark_read_by_system_id' && notificationId && userEmail) {
      // Mark old notifications as read by system notification ID and user email
      // First get user ID
      const userResult = await db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(userEmail)
        .first();

      if (!userResult) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userId = userResult.id;
      
      // Mark as read in user_notifications using system notification ID and user ID
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = ? 
        WHERE notification_id = ? AND user_id = ?
      `).bind(
        Math.floor(Date.now() / 1000),
        notificationId,
        userId
      ).run();
    } else if (action === 'mark_unread' && notificationId) {
      // Mark specific notification as unread
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = NULL 
        WHERE id = ?
      `).bind(notificationId).run();
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