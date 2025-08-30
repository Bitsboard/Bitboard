// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
// Import dynamically to avoid top-level failures if adapter not present

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== "function") {
    return NextResponse.json({ error: "@cloudflare/next-on-pages not available" }, { status: 500 });
  }
  const db = mod.getRequestContext().env.DB as D1Database;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  
  try {
    console.log('🔍 Fetching listing with ID:', id);
    
    // First, try to get just the basic listing data
    const listing = await db.prepare(`
      SELECT * FROM listings WHERE id = ?
    `).bind(id).first();
    
    if (!listing) {
      console.log('🔍 No listing found with ID:', id);
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }
    
    console.log('🔍 Raw listing data:', listing);
    
    // Type assertion for the database result
    const dbListing = listing as any;
    
    // Fetch real images from listing_images table
    let images: string[] = [];
    try {
      const imagesResult = await db.prepare(`
        SELECT image_url, image_order 
        FROM listing_images 
        WHERE listing_id = ? 
        ORDER BY image_order
      `).bind(id).all();
      
      if (imagesResult.results && imagesResult.results.length > 0) {
        images = imagesResult.results.map((row: any) => row.image_url);
      } else if (dbListing.image_url && dbListing.image_url.trim()) {
        // Fallback to the original image_url field
        images = [dbListing.image_url];
      }
    } catch (error) {
      console.error('🔍 Error fetching images:', error);
      // Fallback to the original image_url field
      if (dbListing.image_url && dbListing.image_url.trim()) {
        images = [dbListing.image_url];
      }
    }
    
    // Transform the data to match the expected Listing interface
    const transformedListing = {
      id: String(dbListing.id),
      title: dbListing.title || 'Untitled',
      description: dbListing.description || 'No description available',
      priceSats: Number(dbListing.price_sats) || 0,
      category: dbListing.category || 'Featured',
      location: dbListing.location || 'Unknown',
      lat: Number(dbListing.lat) || 0,
      lng: Number(dbListing.lng) || 0,
      type: dbListing.type || 'sell',
      images: images, // Use real images from listing_images table
      boostedUntil: dbListing.boosted_until || null,
      seller: {
        name: dbListing.seller_username || dbListing.username || 'Unknown',
        score: 0,
        deals: 0,
        rating: 0,
        verifications: {
          email: false,
          phone: false,
          lnurl: false
        },
        onTimeRelease: 0
      },
      createdAt: Number(dbListing.created_at) || Date.now()
    };
    
    console.log('🔍 Transformed listing:', transformedListing);
    return NextResponse.json(transformedListing);
  } catch (error) {
    console.error('🔍 Error fetching listing:', error);
    return NextResponse.json({ 
      error: "internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== "function") {
    return NextResponse.json({ error: "@cloudflare/next-on-pages not available" }, { status: 500 });
  }
  const db = mod.getRequestContext().env.DB as D1Database;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const res = await db.prepare("DELETE FROM listings WHERE id = ?").bind(id).run();
  const changes = (res as any).meta?.changes ?? 0;
  return NextResponse.json({ ok: changes > 0 });
}
