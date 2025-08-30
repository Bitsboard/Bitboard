export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { listingIds: string[] };
    const { listingIds } = body;
    
    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid listing IDs provided' 
      }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed' 
      }, { status: 500 });
    }

    // Delete related data first (chats, messages, images)
    const placeholders = listingIds.map(() => '?').join(',');
    
    // Delete messages in chats related to these listings
    const deleteMessagesQuery = `
      DELETE FROM messages 
      WHERE chat_id IN (
        SELECT id FROM chats WHERE listing_id IN (${placeholders})
      )
    `;
    await db.prepare(deleteMessagesQuery).bind(...listingIds).run();

    // Delete chats related to these listings
    const deleteChatsQuery = `
      DELETE FROM chats 
      WHERE listing_id IN (${placeholders})
    `;
    await db.prepare(deleteChatsQuery).bind(...listingIds).run();

    // Delete listing images
    const deleteImagesQuery = `
      DELETE FROM listing_images 
      WHERE listing_id IN (${placeholders})
    `;
    await db.prepare(deleteImagesQuery).bind(...listingIds).run();

    // Finally delete the listings
    const deleteListingsQuery = `
      DELETE FROM listings 
      WHERE id IN (${placeholders})
    `;
    const result = await db.prepare(deleteListingsQuery).bind(...listingIds).run();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully deleted ${listingIds.length} listings`,
        deletedCount: (result as any).changes || 0
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete listings' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
