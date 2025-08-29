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
    
    // Transform the data to match the expected Listing interface
    const transformedListing = {
      id: listing.id.toString(),
      title: listing.title,
      description: listing.description,
      priceSats: listing.price_sats,
      category: listing.category,
      location: listing.location,
      lat: listing.lat,
      lng: listing.lng,
      type: listing.type,
      images: listing.images ? JSON.parse(listing.images) : [],
      boostedUntil: listing.boosted_until,
      seller: {
        name: listing.seller_name,
        score: listing.seller_score || 0,
        deals: listing.seller_deals || 0,
        rating: listing.seller_rating || 0,
        verifications: {
          email: listing.email_verified || false,
          phone: listing.phone_verified || false,
          lnurl: listing.lnurl_verified || false
        },
        onTimeRelease: listing.on_time_release || 0
      },
      createdAt: listing.created_at
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
