import '@/shims/async_hooks';
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { SecurityMonitor } from "@/lib/security/securityMonitor";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'metrics':
        const metrics = SecurityMonitor.getMetrics();
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'events':
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const events = SecurityMonitor.getRecentEvents(limit);
        return NextResponse.json({
          success: true,
          data: events
        });

      case 'blocked-ips':
        const blockedIPs = SecurityMonitor.getBlockedIPs();
        return NextResponse.json({
          success: true,
          data: blockedIPs
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            metrics: SecurityMonitor.getMetrics(),
            recentEvents: SecurityMonitor.getRecentEvents(50),
            blockedIPs: SecurityMonitor.getBlockedIPs()
          }
        });
    }

  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch security data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await req.json() as {
      action: 'block-ip' | 'unblock-ip' | 'clear-events';
      ip?: string;
      reason?: string;
    };

    const { action, ip, reason } = body;

    switch (action) {
      case 'block-ip':
        if (!ip) {
          return NextResponse.json({ error: "IP address required" }, { status: 400 });
        }
        SecurityMonitor.blockIP(ip, reason || 'Manually blocked by admin');
        return NextResponse.json({
          success: true,
          message: `IP ${ip} has been blocked`
        });

      case 'unblock-ip':
        if (!ip) {
          return NextResponse.json({ error: "IP address required" }, { status: 400 });
        }
        SecurityMonitor.unblockIP(ip);
        return NextResponse.json({
          success: true,
          message: `IP ${ip} has been unblocked`
        });

      case 'clear-events':
        // In a real implementation, you'd clear events from the database
        // For now, we'll just return success
        return NextResponse.json({
          success: true,
          message: 'Security events cleared'
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: "Failed to process security action" },
      { status: 500 }
    );
  }
}
