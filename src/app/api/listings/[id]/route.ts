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
    const listing = await db.prepare(`
      SELECT 
        l.*,
        u.username as seller_name,
        u.verified as seller_verified,
        u.score as seller_score,
        u.deals as seller_deals,
        u.rating as seller_rating,
        u.email_verified,
        u.phone_verified,
        u.lnurl_verified,
        u.on_time_release
      FROM listings l
      LEFT JOIN users u ON l.seller_id = u.id
      WHERE l.id = ?
    `).bind(id).first();
    
    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }
    
    // Type assertion for the database result
    const dbListing = listing as any;
    
    // Transform the data to match the expected Listing interface
    const transformedListing = {
      id: String(dbListing.id),
      title: dbListing.title || '',
      description: dbListing.description || '',
      priceSats: Number(dbListing.price_sats) || 0,
      category: dbListing.category || 'Featured',
      location: dbListing.location || 'Unknown',
      lat: Number(dbListing.lat) || 0,
      lng: Number(dbListing.lng) || 0,
      type: dbListing.type || 'sell',
      images: dbListing.images ? JSON.parse(dbListing.images) : [],
      boostedUntil: dbListing.boosted_until || null,
      seller: {
        name: dbListing.seller_name || 'Unknown',
        score: Number(dbListing.seller_score) || 0,
        deals: Number(dbListing.seller_deals) || 0,
        rating: Number(dbListing.seller_rating) || 0,
        verifications: {
          email: Boolean(dbListing.email_verified) || false,
          phone: Boolean(dbListing.phone_verified) || false,
          lnurl: Boolean(dbListing.lnurl_verified) || false
        },
        onTimeRelease: Number(dbListing.on_time_release) || 0
      },
      createdAt: Number(dbListing.created_at) || Date.now()
    };
    
    return NextResponse.json(transformedListing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
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
