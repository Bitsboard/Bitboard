import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  try {
    // This endpoint is only for testing purposes
    // It wipes the georged1997@gmail.com account from the database
    
    const email = 'georged1997@gmail.com';
    
    // Get user ID first
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available' 
      }, { status: 500 });
    }
    
    // Get user ID
    const userResult = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    
    if (!userResult) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    const userId = userResult.id as string;
    
    // Delete in order to respect foreign key constraints
    const deleteQueries = [
      // Delete offers where user is involved
      `DELETE FROM offers WHERE from_user_id = ? OR to_user_id = ?`,
      
      // Delete messages
      `DELETE FROM messages WHERE from_id = ?`,
      
      // Delete chats where user is involved
      `DELETE FROM chats WHERE buyer_id = ? OR seller_id = ?`,
      
      // Delete user blocks
      `DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?`,
      
      // Delete hidden conversations
      `DELETE FROM hidden_conversations WHERE user_id = ?`,
      
      // Delete saved searches
      `DELETE FROM saved_searches WHERE user_id = ?`,
      
      // Delete listing images for user's listings
      `DELETE FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE posted_by = ?)`,
      
      // Delete listings
      `DELETE FROM listings WHERE posted_by = ?`,
      
      // Finally delete the user
      `DELETE FROM users WHERE id = ?`
    ];
    
    for (const query of deleteQueries) {
      try {
        if (query.includes('offers') || query.includes('chats') || query.includes('user_blocks')) {
          // Queries that need two user IDs
          await db.prepare(query).bind(userId, userId).run();
        } else if (query.includes('listing_images')) {
          // Special case for listing images
          await db.prepare(query).bind(userId).run();
        } else {
          // Single user ID queries
          await db.prepare(query).bind(userId).run();
        }
      } catch (error) {
        console.error(`Error executing query: ${query}`, error);
        // Continue with other queries even if one fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test account wiped successfully' 
    });
    
  } catch (error) {
    console.error('Error wiping test account:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to wipe test account' 
    }, { status: 500 });
  }
}
