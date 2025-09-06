export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";
import type { D1Database } from "@cloudflare/workers-types";

interface SystemNotificationRequest {
  targetGroup: 'all' | 'verified' | 'unverified' | 'admin' | 'buyers' | 'sellers';
  title: string;
  message: string;
  icon: 'info' | 'success' | 'warning' | 'error' | 'system';
  actionUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSessionFromRequest(request);
    console.log('🔔 Admin notifications - session:', session);
    
    if (!session || !session.user) {
      console.log('🔔 Admin notifications - No session or user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    console.log('🔔 Admin notifications - adminEmails:', adminEmails);
    console.log('🔔 Admin notifications - user email:', session.user.email);
    
    if (!adminEmails.includes(session.user.email)) {
      console.log('🔔 Admin notifications - User not in admin emails list');
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body: SystemNotificationRequest = await request.json();
    
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

    const env = getRequestContext().env;
    const db = env.DB as D1Database;
    
    console.log('🔔 Admin notifications - Database connection:', !!db);
    if (!db) {
      console.error('🔔 Admin notifications - No database connection!');
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Generate unique notification ID
    const notificationId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Math.floor(Date.now() / 1000);

    // Store the notification in the database
    console.log('🔔 Admin notifications - Inserting system notification:', {
      notificationId,
      title: body.title,
      message: body.message,
      icon: body.icon,
      targetGroup: body.targetGroup
    });
    
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
    
    console.log('🔔 Admin notifications - System notification inserted successfully');

    // Get all users that match the target group
    let userQuery = 'SELECT id FROM users WHERE 1=1';
    const params: any[] = [];

    if (body.targetGroup === 'verified') {
      userQuery += ' AND verified = 1';
    } else if (body.targetGroup === 'unverified') {
      userQuery += ' AND verified = 0';
    } else if (body.targetGroup === 'admin') {
      // Get admin users based on email
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      if (adminEmails.length > 0) {
        const placeholders = adminEmails.map(() => '?').join(',');
        userQuery += ` AND email IN (${placeholders})`;
        params.push(...adminEmails);
      } else {
        // No admin emails configured, skip
        userQuery += ' AND 1=0';
      }
    }
    // For 'all', 'buyers', 'sellers' - we send to all users for now
    // In a real implementation, you'd track user roles

    console.log('🔔 Admin notifications - User query:', userQuery);
    console.log('🔔 Admin notifications - Query params:', params);
    
    const usersResult = await db.prepare(userQuery).bind(...params).all();
    const users = usersResult.results as { id: string }[];
    
    console.log('🔔 Admin notifications - Found users:', users.length);

    // Create user notification records for each user
    if (users.length > 0) {
      const userNotificationId = `un_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert user notifications in batches
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const values = batch.map(() => 
          `(?, ?, ?, ?)`
        ).join(', ');
        
        const batchParams = batch.flatMap((user, index) => [
          `${userNotificationId}_${i + index}`,
          user.id,
          notificationId,
          createdAt
        ]);

        await db.prepare(`
          INSERT INTO user_notifications (id, user_id, notification_id, created_at)
          VALUES ${values}
        `).bind(...batchParams).run();
      }
    }

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
    console.error('Error sending system notification:', error);
    return NextResponse.json(
      { error: "Failed to send system notification" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // TODO: In a real implementation, return list of sent notifications
    return NextResponse.json({
      success: true,
      notifications: []
    });
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    return NextResponse.json(
      { error: "Failed to fetch system notifications" },
      { status: 500 }
    );
  }
}
