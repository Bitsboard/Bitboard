import '@/shims/async_hooks';
import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { adminRateLimiter } from "@/lib/security/rateLimiter";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    // Apply rate limiting
    const rateLimit = await adminRateLimiter(req);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        error: 'Not authenticated' 
      });
    }

    const adminStatus = await isAdmin(session.user.email);
    return NextResponse.json({ 
      success: true,
      isAdmin: adminStatus 
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ 
      success: false,
      isAdmin: false,
      error: 'server_error' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Apply rate limiting for login attempts
    const rateLimit = await adminRateLimiter(req);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { password } = await req.json() as { password: string };
    
    // Check if password matches admin password from environment
    let adminPassword = 'admin123'; // default fallback
    
    try {
      // Try to get from Cloudflare context first (Edge runtime)
      const { getRequestContext } = require('@cloudflare/next-on-pages');
      const env = getRequestContext().env;
      adminPassword = env.ADMIN_PASSWORD || 'admin123';
    } catch {
      // Fallback to process.env for Node runtime
      adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    }
    
    if (password !== adminPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 401 });
    }

    // For now, if password is correct, allow admin access
    // TODO: In production, this should also check for valid OAuth session
    // and verify the user's email is in ADMIN_EMAILS list

    return NextResponse.json({ 
      success: true,
      isAdmin: true 
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'server_error' 
    }, { status: 500 });
  }
}
