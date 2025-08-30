import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

// Configure for Edge Runtime (required for Cloudflare Pages)
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = params.listingId;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const db = await getD1();
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // First try to get images from the listing_images table
    const imagesResult = await db.prepare(`
      SELECT image_url, image_order 
      FROM listing_images 
      WHERE listing_id = ? 
      ORDER BY image_order
    `).bind(listingId).all();

    let images: string[] = [];
    
    if (imagesResult.results && imagesResult.results.length > 0) {
      // Use images from listing_images table
      images = imagesResult.results.map((row: any) => row.image_url);
    } else {
      // Fallback to the original image_url field
      const listingResult = await db.prepare(`
        SELECT image_url FROM listings WHERE id = ?
      `).bind(listingId).first();
      
      if (listingResult && listingResult.image_url) {
        images = [listingResult.image_url];
      }
    }

    return NextResponse.json({
      success: true,
      images: images
    });

  } catch (error) {
    console.error('Error retrieving listing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve images' },
      { status: 500 }
    );
  }
}
