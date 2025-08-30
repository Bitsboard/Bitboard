import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/cf';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Get client IP and session for safety measures
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    
    // Generate a session ID from headers (user agent + some other identifiable info)
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const acceptLanguage = request.headers.get('accept-language') || 'unknown';
    const sessionId = Buffer.from(`${userAgent}:${acceptLanguage}`).toString('base64').substring(0, 16);

    const db = getDB();

    // Check if this IP/session has already viewed this listing recently (within 1 hour)
    const oneHourAgo = Math.floor(Date.now() / 1000) - (60 * 60);
    
    const existingView = await db.prepare(`
      SELECT id FROM view_logs 
      WHERE listing_id = ? AND viewer_ip = ? AND viewer_session = ? AND viewed_at > ?
    `).bind(listingId, ip, sessionId, oneHourAgo).first();

    if (existingView) {
      // View already recorded recently, return success but don't increment
      return NextResponse.json({ 
        success: true, 
        message: 'View already recorded recently',
        alreadyViewed: true 
      });
    }

    // Begin transaction
    const transaction = await db.batch([
      // Insert view log
      db.prepare(`
        INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        `${listingId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        listingId,
        ip,
        sessionId,
        Math.floor(Date.now() / 1000)
      ),
      
      // Increment view count
      db.prepare(`
        UPDATE listings 
        SET views = views + 1 
        WHERE id = ?
      `).bind(listingId)
    ]);

    // Get updated view count
    const updatedListing = await db.prepare(`
      SELECT views FROM listings WHERE id = ?
    `).bind(listingId).first();

    return NextResponse.json({
      success: true,
      message: 'View recorded successfully',
      views: updatedListing?.views || 0,
      alreadyViewed: false
    });

  } catch (error) {
    console.error('Error recording listing view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

// GET method to retrieve current view count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    
    const listing = await db.prepare(`
      SELECT views FROM listings WHERE id = ?
    `).bind(listingId).first();

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      views: listing.views || 0
    });

  } catch (error) {
    console.error('Error retrieving listing views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve view count' },
      { status: 500 }
    );
  }
}
