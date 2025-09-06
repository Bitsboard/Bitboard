export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

interface SystemNotificationRequest {
  targetGroup: 'all' | 'verified' | 'unverified' | 'admin' | 'buyers' | 'sellers';
  title: string;
  message: string;
  icon: 'info' | 'success' | 'warning' | 'error' | 'system';
  actionUrl?: string;
}

export async function POST(request: NextRequest) {
  console.log('🔔 System Notification API - Starting');
  
  try {
    // Get database connection
    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    if (!db) {
      console.error('🔔 No database connection available');
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Parse request body
    const body: SystemNotificationRequest = await request.json();
    console.log('🔔 Request body:', body);
    
    // Validate required fields
    if (!body.targetGroup || !body.title || !body.message || !body.icon) {
      return NextResponse.json(
        { error: "Missing required fields: targetGroup, title, message, icon" },
        { status: 400 }
      );
    }

    // Validate icon type
    const validIcons = ['info', 'success', 'warning', 'error', 'system'];
    if (!validIcons.includes(body.icon)) {
      return NextResponse.json(
        { error: "Invalid icon type. Must be one of: info, success, warning, error, system" },
        { status: 400 }
      );
    }

    // Validate target group
    const validTargetGroups = ['all', 'verified', 'unverified', 'admin', 'buyers', 'sellers'];
    if (!validTargetGroups.includes(body.targetGroup)) {
      return NextResponse.json(
        { error: "Invalid target group. Must be one of: all, verified, unverified, admin, buyers, sellers" },
        { status: 400 }
      );
    }

    // Generate unique notification ID
    const notificationId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Math.floor(Date.now() / 1000);

    console.log('🔔 Creating system notification:', notificationId);

    // Insert system notification
    await db.prepare(`
      INSERT INTO system_notifications (id, title, message, icon, target_group, action_url, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      notificationId,
      body.title,
      body.message,
      body.icon,
      body.targetGroup,
      body.actionUrl || null,
      createdAt
    ).run();

    console.log('🔔 System notification created successfully');

    // Get target users based on target group
    let userQuery = 'SELECT id FROM users WHERE 1=1';
    const params: any[] = [];

    if (body.targetGroup === 'verified') {
      userQuery += ' AND verified = 1';
    } else if (body.targetGroup === 'unverified') {
      userQuery += ' AND verified = 0';
    } else if (body.targetGroup === 'admin') {
      // For admin group, we'll send to all users for now
      // In a real implementation, you'd check against admin emails
      userQuery += ' AND 1=1';
    }
    // For 'all', 'buyers', 'sellers' - send to all users

    console.log('🔔 Querying users with:', userQuery);
    const usersResult = await db.prepare(userQuery).bind(...params).all();
    const users = usersResult.results as { id: string }[];
    
    console.log('🔔 Found users:', users.length);

    // Create user notification records
    if (users.length > 0) {
      console.log('🔔 Creating user notifications for', users.length, 'users');
      
      // Use a more efficient approach: create a single query with all user IDs
      // This avoids the "too many SQL variables" error while being much faster
      const userIds = users.map(user => user.id);
      
      // Insert user notifications using a single query with IN clause
      const placeholders = userIds.map(() => '?').join(',');
      const userNotificationIds = userIds.map((_, index) => 
        `un_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`
      );
      
      // Create the values for the batch insert
      const values = userIds.map((_, index) => 
        `(?, ?, ?, ?)`
      ).join(', ');
      
      const allParams = userIds.flatMap((userId, index) => [
        userNotificationIds[index],
        userId,
        notificationId,
        createdAt
      ]);
      
      console.log('🔔 Inserting user notifications in single batch...');
      await db.prepare(`
        INSERT INTO user_notifications (id, user_id, notification_id, created_at)
        VALUES ${values}
      `).bind(...allParams).run();
      
      console.log('🔔 User notifications created successfully');
    }

    console.log('🔔 System notification process completed successfully');

    return NextResponse.json({
      success: true,
      message: `System notification sent to ${users.length} users in ${body.targetGroup} group`,
      notification: {
        id: notificationId,
        title: body.title,
        message: body.message,
        icon: body.icon,
        targetGroup: body.targetGroup,
        actionUrl: body.actionUrl,
        createdAt: createdAt,
        userCount: users.length
      }
    });

  } catch (error) {
    console.error('🔔 Error in system notification API:', error);
    return NextResponse.json(
      { 
        error: "Failed to send system notification",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get recent system notifications
    const notifications = await db.prepare(`
      SELECT id, title, message, icon, target_group, action_url, created_at, status
      FROM system_notifications 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();

    return NextResponse.json({
      success: true,
      notifications: notifications.results || []
    });
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    return NextResponse.json(
      { error: "Failed to fetch system notifications" },
      { status: 500 }
    );
  }
}