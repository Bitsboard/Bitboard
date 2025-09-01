export const runtime = 'edge';

import { getAdminDb } from '../../../_util';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const db = await getAdminDb(req);
    const { userId } = params;

    // Get all listings for this user with engagement metrics and images
    const listingsQuery = `
      SELECT 
        l.id,
        l.title,
        l.price_sat AS priceSat,
        l.ad_type AS adType,
        l.location,
        l.category,
        l.status,
        l.created_at AS createdAt,
        COALESCE(l.views, 0) AS views,
        COALESCE(chat_stats.chats_count, 0) AS replies,
        GROUP_CONCAT(li.image_url) AS images
      FROM listings l
      LEFT JOIN (
        SELECT 
          listing_id,
          COUNT(*) AS chats_count
        FROM chats
        GROUP BY listing_id
      ) chat_stats ON l.id = chat_stats.listing_id
      LEFT JOIN listing_images li ON l.id = li.listing_id
      WHERE l.posted_by = ?
      GROUP BY l.id, l.title, l.price_sat, l.ad_type, l.location, l.category, l.status, l.created_at, l.views, chat_stats.chats_count
      ORDER BY l.created_at DESC
    `;

    const listings = await db.prepare(listingsQuery).bind(userId).all();

    return new Response(JSON.stringify({ 
      success: true,
      listings: listings.results ?? []
    }), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), { status: code });
  }
}
