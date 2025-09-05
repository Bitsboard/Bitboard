/**
 * API Security Middleware
 * Applies rate limiting and security checks to API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, rateLimiters } from "@/lib/security/rateLimiter";
import { withSecurity, SecurityMonitor } from "@/lib/security/securityMonitor";

export async function applyAPISecurity(req: Request, endpoint: string): Promise<Response | undefined> {
  // Apply security checks first
  const securityCheck = withSecurity(req);
  if (securityCheck) {
    return securityCheck;
  }

  // Apply rate limiting based on endpoint
  let rateLimiter;
  
  if (endpoint.includes('/auth/')) {
    rateLimiter = rateLimiters.auth;
  } else if (endpoint.includes('/chat/')) {
    rateLimiter = rateLimiters.chat;
  } else if (endpoint.includes('/listings') && req.method === 'POST') {
    rateLimiter = rateLimiters.listings;
  } else if (endpoint.includes('/search') || endpoint.includes('/places')) {
    rateLimiter = rateLimiters.search;
  } else if (endpoint.includes('/admin/')) {
    rateLimiter = rateLimiters.admin;
  } else {
    rateLimiter = rateLimiters.api;
  }

  const rateLimitCheck = await withRateLimit(rateLimiter)(req);
  if (rateLimitCheck) {
    // Log rate limit exceeded
    const ip = SecurityMonitor.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    SecurityMonitor.logRateLimitExceeded(ip, userAgent, endpoint);
    
    return rateLimitCheck;
  }

  return undefined; // No security issues
}

/**
 * Enhanced API response with security headers
 */
export function secureResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    ...headers
  };

  return NextResponse.json(data, { 
    status, 
    headers: securityHeaders 
  });
}

/**
 * Log API usage for monitoring
 */
export function logAPIUsage(req: Request, endpoint: string, status: number, responseTime: number) {
  const ip = SecurityMonitor.getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`API ${req.method} ${endpoint} - ${status} - ${responseTime}ms - ${ip}`);
  }

  // In production, you might want to send this to a monitoring service
  // like DataDog, New Relic, or CloudWatch
}
