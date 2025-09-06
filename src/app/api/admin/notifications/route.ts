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
  console.log('🔔 Admin notifications - POST request started');
  try {
    // Check admin authentication
    console.log('🔔 Admin notifications - Getting session...');
    const session = await getSessionFromRequest(request);
    console.log('🔔 Admin notifications - session:', session);
    
    if (!session || !session.user) {
      console.log('🔔 Admin notifications - No session or user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get environment variables from Cloudflare context (not process.env on Edge)
    console.log('🔔 Admin notifications - Getting environment context...');
    const env = getRequestContext().env;
    console.log('🔔 Admin notifications - Environment context:', !!env);
    console.log('🔔 Admin notifications - ADMIN_EMAILS raw:', env.ADMIN_EMAILS);
    
    const adminEmails = ((env.ADMIN_EMAILS as string) ?? '')
      .split(',')
      .map((e: string) => e.trim())
      .filter(Boolean);
    console.log('🔔 Admin notifications - adminEmails processed:', adminEmails);
    console.log('🔔 Admin notifications - user email:', session.user.email);
    
    if (!adminEmails.includes(session.user.email)) {
      console.log('🔔 Admin notifications - User not in admin emails list');
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    console.log('🔔 Admin notifications - Parsing request body...');
    const body: SystemNotificationRequest = await request.json();
    console.log('🔔 Admin notifications - Request body:', body);
    
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

    // Database is already available from env above
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
      // Get admin users based on email (use the adminEmails from above)
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
      console.log('🔔 Admin notifications - Creating user notifications for', users.length, 'users');
      
      // Insert user notifications in batches
      const batchSize = 50; // Reduced batch size for safety
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        console.log(`🔔 Admin notifications - Processing batch ${Math.floor(i/batchSize) + 1}, users ${i + 1}-${Math.min(i + batchSize, users.length)}`);
        
        const values = batch.map(() => `(?, ?, ?, ?)`).join(', ');
        const batchParams = batch.flatMap((user, index) => [
          `un_${Date.now()}_${i + index}_${Math.random().toString(36).substr(2, 6)}`,
          user.id,
          notificationId,
          createdAt
        ]);

        console.log(`🔔 Admin notifications - Batch params count: ${batchParams.length}, Values count: ${batch.length * 4}`);
        
        const result = await db.prepare(`
          INSERT INTO user_notifications (id, user_id, notification_id, created_at)
          VALUES ${values}
        `).bind(...batchParams).run();
        
        console.log(`🔔 Admin notifications - Batch insert result:`, result);
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
