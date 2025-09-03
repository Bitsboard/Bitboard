/**
 * Security Monitoring System
 * Tracks security events and suspicious activity
 */

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'blocked_ip' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: number;
}

interface SecurityMetrics {
  blockedIPs: number;
  failedLogins: number;
  suspiciousActivity: number;
  rateLimitHits: number;
  last24h: SecurityEvent[];
}

// In-memory store for security events (in production, use a proper database)
const securityEvents: SecurityEvent[] = [];
const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, number>(); // IP -> count

// Clean up old events (keep last 7 days) - called manually since setInterval doesn't work in Edge Runtime
function cleanupOldEvents() {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const initialLength = securityEvents.length;
  
  for (let i = securityEvents.length - 1; i >= 0; i--) {
    if (securityEvents[i].timestamp < sevenDaysAgo) {
      securityEvents.splice(i, 1);
    }
  }
  
  if (securityEvents.length !== initialLength) {
    console.log(`Cleaned up ${initialLength - securityEvents.length} old security events`);
  }
}

export class SecurityMonitor {
  /**
   * Log a security event
   */
  static logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    securityEvents.push(securityEvent);

    // Check for suspicious patterns
    this.checkSuspiciousActivity(securityEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', securityEvent);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private static checkSuspiciousActivity(event: SecurityEvent): void {
    const ip = event.ip;
    
    // Count events from this IP in the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentEvents = securityEvents.filter(e => 
      e.ip === ip && e.timestamp > oneHourAgo
    );

    // If more than 10 events from same IP in last hour, mark as suspicious
    if (recentEvents.length > 10) {
      const currentCount = suspiciousIPs.get(ip) || 0;
      suspiciousIPs.set(ip, currentCount + 1);

      // If IP is consistently suspicious, consider blocking
      if (currentCount > 5) {
        this.blockIP(ip, 'Consistent suspicious activity');
      }
    }
  }

  /**
   * Block an IP address
   */
  static blockIP(ip: string, reason: string): void {
    blockedIPs.add(ip);
    
    this.logEvent({
      type: 'blocked_ip',
      severity: 'high',
      ip,
      userAgent: 'system',
      details: { reason, blockedAt: new Date().toISOString() }
    });

    console.log(`Blocked IP: ${ip} - Reason: ${reason}`);
  }

  /**
   * Check if IP is blocked
   */
  static isIPBlocked(ip: string): boolean {
    return blockedIPs.has(ip);
  }

  /**
   * Unblock an IP address
   */
  static unblockIP(ip: string): void {
    blockedIPs.delete(ip);
    suspiciousIPs.delete(ip);
    
    this.logEvent({
      type: 'admin_action',
      severity: 'low',
      ip,
      userAgent: 'admin',
      details: { action: 'unblock_ip', unblockedAt: new Date().toISOString() }
    });
  }

  /**
   * Log failed login attempt
   */
  static logFailedLogin(ip: string, userAgent: string, email?: string): void {
    this.logEvent({
      type: 'failed_login',
      severity: 'medium',
      ip,
      userAgent,
      details: { email, attemptTime: new Date().toISOString() }
    });

    // Check for brute force attempts
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentFailedLogins = securityEvents.filter(e => 
      e.ip === ip && 
      e.type === 'failed_login' && 
      e.timestamp > oneHourAgo
    );

    if (recentFailedLogins.length > 5) {
      this.blockIP(ip, 'Multiple failed login attempts');
    }
  }

  /**
   * Log rate limit exceeded
   */
  static logRateLimitExceeded(ip: string, userAgent: string, endpoint: string): void {
    this.logEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      ip,
      userAgent,
      details: { endpoint, exceededAt: new Date().toISOString() }
    });
  }

  /**
   * Log suspicious activity
   */
  static logSuspiciousActivity(ip: string, userAgent: string, activity: string, details: Record<string, any> = {}): void {
    this.logEvent({
      type: 'suspicious_activity',
      severity: 'high',
      ip,
      userAgent,
      details: { activity, ...details, detectedAt: new Date().toISOString() }
    });
  }

  /**
   * Get security metrics
   */
  static getMetrics(): SecurityMetrics {
    try {
      // Clean up old events first
      cleanupOldEvents();
      
      const now = Date.now();
      const last24h = now - (24 * 60 * 60 * 1000);
      
      const recentEvents = securityEvents.filter(e => e.timestamp > last24h);
      
      return {
        blockedIPs: blockedIPs.size,
        failedLogins: recentEvents.filter(e => e.type === 'failed_login').length,
        suspiciousActivity: recentEvents.filter(e => e.type === 'suspicious_activity').length,
        rateLimitHits: recentEvents.filter(e => e.type === 'rate_limit_exceeded').length,
        last24h: recentEvents
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      // Return default metrics if there's an error
      return {
        blockedIPs: 0,
        failedLogins: 0,
        suspiciousActivity: 0,
        rateLimitHits: 0,
        last24h: []
      };
    }
  }

  /**
   * Get recent security events
   */
  static getRecentEvents(limit: number = 100): SecurityEvent[] {
    try {
      return securityEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get blocked IPs
   */
  static getBlockedIPs(): string[] {
    try {
      return Array.from(blockedIPs);
    } catch (error) {
      console.error('Error getting blocked IPs:', error);
      return [];
    }
  }

  /**
   * Extract client IP from request
   */
  static getClientIP(req: Request): string {
    const headers = req.headers;
    
    // Cloudflare
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) return cfConnectingIp;
    
    // Standard headers
    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) return xRealIp;
    
    // Fallback
    return 'unknown';
  }
}

/**
 * Security middleware for API routes
 */
export function withSecurity(req: Request) {
  const ip = SecurityMonitor.getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Check if IP is blocked
  if (SecurityMonitor.isIPBlocked(ip)) {
    return new Response(
      JSON.stringify({
        error: 'Access denied',
        message: 'Your IP address has been blocked due to suspicious activity'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Check for suspicious patterns in request
  const url = new URL(req.url);
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /eval\(/i, // Code injection
  ];

  const pathname = url.pathname;
  const searchParams = url.search;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(pathname) || pattern.test(searchParams)) {
      SecurityMonitor.logSuspiciousActivity(ip, userAgent, 'Suspicious request pattern', {
        pathname,
        searchParams,
        pattern: pattern.toString()
      });
      
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Request contains suspicious patterns'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return null; // No security issues
}
