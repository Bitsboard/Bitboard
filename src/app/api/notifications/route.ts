export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check user authentication
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const env = getRequestContext().env;
    const db = env.DB;

    // Get user's notifications with system notification details
    const notificationsResult = await db.prepare(`
      SELECT 
        un.id,
        un.read_at,
        un.created_at,
        sn.title,
        sn.message,
        sn.icon,
        sn.action_url,
        sn.target_group
      FROM user_notifications un
      JOIN system_notifications sn ON un.notification_id = sn.id
      WHERE un.user_id = ? AND sn.status = 'active'
      ORDER BY un.created_at DESC
    `).bind(session.user.id).all();

    const notifications = notificationsResult.results.map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      timestamp: notification.created_at * 1000, // Convert to milliseconds for frontend
      read: !!notification.read_at,
      type: 'system' as const,
      icon: notification.icon,
      actionUrl: notification.action_url,
      targetGroup: notification.target_group
    }));

    return NextResponse.json({
      success: true,
      notifications
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
    // Check user authentication
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { notificationId: string; action: 'mark_read' | 'mark_unread' };
    
    if (!body.notificationId || !body.action) {
      return NextResponse.json(
        { error: "Missing required fields: notificationId, action" },
        { status: 400 }
      );
    }

    const env = getRequestContext().env;
    const db = env.DB;

    if (body.action === 'mark_read') {
      // Mark notification as read
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = ? 
        WHERE id = ? AND user_id = ?
      `).bind(
        Math.floor(Date.now() / 1000),
        body.notificationId,
        session.user.id
      ).run();
    } else if (body.action === 'mark_unread') {
      // Mark notification as unread
      await db.prepare(`
        UPDATE user_notifications 
        SET read_at = NULL 
        WHERE id = ? AND user_id = ?
      `).bind(
        body.notificationId,
        session.user.id
      ).run();
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${body.action === 'mark_read' ? 'marked as read' : 'marked as unread'}`
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
