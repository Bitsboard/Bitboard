export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";

interface SystemNotificationRequest {
  targetGroup: 'all' | 'verified' | 'unverified' | 'admin' | 'buyers' | 'sellers';
  title: string;
  message: string;
  icon: 'info' | 'success' | 'warning' | 'error' | 'system';
  actionUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
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

    // TODO: In a real implementation, you would:
    // 1. Store the notification in the database
    // 2. Send it to all users matching the target group
    // 3. Update user notification counts
    // 4. Potentially send real-time notifications via WebSocket
    
    // For now, we'll simulate success and return the notification details
    const notification = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'system' as const,
      title: body.title,
      message: body.message,
      icon: body.icon,
      targetGroup: body.targetGroup,
      actionUrl: body.actionUrl,
      timestamp: Date.now(),
      sentAt: new Date().toISOString(),
      status: 'sent'
    };


    return NextResponse.json({
      success: true,
      message: `System notification sent to ${body.targetGroup} users`,
      notification: notification
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
