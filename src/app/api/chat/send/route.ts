import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

// Generate a unique chat ID based on userA, userB, and listing
function generateChatId(userA: string, userB: string, listingId: string): string {
  // Generate a proper UUID v4 instead of the string format
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return uuid;
}

// Generate a unique message ID
function generateMessageId(): string {
  // Generate a proper UUID v4 instead of the string format
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return uuid;
}

export async function POST(req: Request) {
  try {
    console.log('=== CHAT SEND API REACHED ===');
    
    // Parse request body
    const { chatId, text, listingId, otherUserId, userEmail } = await req.json() as { 
      chatId?: string; 
      text?: string; 
      listingId?: string;
      otherUserId?: string;
      userEmail?: string;
    };
    
    console.log('Request data:', { chatId, text, listingId, otherUserId, userEmail });
    
    // Validation
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    if (!listingId || !otherUserId) {
      return NextResponse.json({ error: "listingId and otherUserId required" }, { status: 400 });
    }

    // Get database connection
    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    }
    
    // Schema is pre-created via migrations - no need to check on every request
    // await ensureChatSchema(db); // ❌ REMOVED: Expensive schema check on every request
    
    // Validate that the listing exists
    console.log('Validating listing exists...');
    const listingCheck = await db.prepare(`
      SELECT id, title FROM listings WHERE id = ?
    `).bind(listingId).all();
    
    if (!listingCheck.results || listingCheck.results.length === 0) {
      console.log('❌ Listing not found:', listingId);
      return NextResponse.json({ 
        error: 'listing_not_found',
        message: `Listing with ID ${listingId} does not exist`
      }, { status: 404 });
    }
    
    console.log('✅ Listing found:', listingCheck.results[0].title);
    
    // ✅ OPTIMIZED: Simplified user validation with single efficient query
    console.log('Validating other user exists...');
    
    // Check if the other user exists in the users table (most common case)
    const userCheck = await db.prepare(`
      SELECT id, username FROM users WHERE username = ? OR id = ?
      LIMIT 1
    `).bind(otherUserId, otherUserId).all();
    
    if (!userCheck.results || userCheck.results.length === 0) {
      console.log('❌ Other user not found:', otherUserId);
      
      // Fallback: check if they have any listings
      const listingUserCheck = await db.prepare(`
        SELECT DISTINCT posted_by FROM listings WHERE posted_by = ?
        LIMIT 1
      `).bind(otherUserId).all();
      
      if (!listingUserCheck.results || listingUserCheck.results.length === 0) {
        console.log('❌ User not found in listings either:', otherUserId);
        
        // Let's also check what users actually exist to help debug
        const allUsers = await db.prepare(`
          SELECT DISTINCT posted_by FROM listings 
          WHERE posted_by IS NOT NULL AND posted_by != ''
          ORDER BY posted_by
          LIMIT 10
        `).all();
        
        console.log('Available users in listings:', allUsers.results?.map(u => u.posted_by) || []);
        
        return NextResponse.json({ 
          error: 'user_not_found',
          message: `User ${otherUserId} does not exist or has no listings`,
          availableUsers: allUsers.results?.map(u => u.posted_by) || []
        }, { status: 404 });
      }
    }
    
    console.log('✅ Other user validated');
    
    // Now we need to get the actual user IDs for the foreign key constraints
    console.log('Getting actual user IDs for foreign key constraints...');
    
    // Get the current user's ID (they should exist since they're logged in)
    const currentUserCheck = await db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(userEmail).all();
    
    let currentUserId: string;
    if (currentUserCheck.results && currentUserCheck.results.length > 0) {
      currentUserId = currentUserCheck.results[0].id as string;
      console.log('✅ Current user ID found:', currentUserId);
    } else {
      // If current user doesn't exist in users table, this indicates a serious OAuth problem
      console.log('❌ Current user not found in users table:', userEmail);
      
      // Check if OAuth environment variables are properly configured
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!googleClientId || !googleClientSecret) {
        console.error('❌ OAuth environment variables missing on staging');
        return NextResponse.json({ 
          error: 'oauth_configuration_error',
          message: 'OAuth is not properly configured on staging. User accounts cannot be created.',
          details: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'user_not_found',
        message: `User ${userEmail} not found in database. This suggests the OAuth flow failed during login.`,
        details: 'User should have been created during OAuth authentication. Please try logging out and logging back in.',
        oauthConfigured: !!googleClientId && !!googleClientSecret
      }, { status: 404 });
    }
    
    // Get the other user's ID from the users table by username
    const otherUserCheck = await db.prepare(`
      SELECT id FROM users WHERE username = ?
    `).bind(otherUserId).all();
    
    let otherUserActualId: string;
    if (otherUserCheck.results && otherUserCheck.results.length > 0) {
      otherUserActualId = otherUserCheck.results[0].id as string;
      console.log('✅ Other user ID found:', otherUserActualId);
    } else {
      console.log('❌ Other user not found in users table:', otherUserId);
      return NextResponse.json({ 
        error: 'other_user_not_found',
        message: `User ${otherUserId} not found in database`
      }, { status: 404 });
    }
    
    let actualChatId = chatId;
    
    // If no chatId provided, find or create a new chat
    if (!actualChatId) {
      console.log('Finding or creating chat...');
      
      // Check if chat already exists for this user pair and listing
      const existingChat = await db.prepare(`
        SELECT id FROM chats 
        WHERE listing_id = ? AND 
        ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      `).bind(listingId, currentUserId, otherUserActualId, otherUserActualId, currentUserId).all();
      
      if (existingChat.results && existingChat.results.length > 0) {
        actualChatId = existingChat.results[0].id as string;
        console.log('Using existing chat:', actualChatId);
      } else {
        // Create new chat with unique ID
        actualChatId = generateChatId(userEmail, otherUserActualId, listingId);
        console.log('Creating new chat with ID:', actualChatId);
        
        try {
          // First, let's check the exact data types and values we're working with
          console.log('Debug: Checking data types...');
          console.log('listingId type:', typeof listingId, 'value:', listingId);
          console.log('userEmail type:', typeof userEmail, 'value:', userEmail);
          console.log('otherUserId type:', typeof otherUserActualId, 'value:', otherUserActualId);
          
          // Check if the listing_id is actually an integer in the listings table
          const listingTypeCheck = await db.prepare(`
            SELECT id, typeof(id) as id_type FROM listings WHERE id = ? LIMIT 1
          `).bind(listingId).all();
          
          if (listingTypeCheck.results && listingTypeCheck.results.length > 0) {
            console.log('Listing ID type in database:', listingTypeCheck.results[0].id_type);
          }
          
          // Try to create the chat with proper data type handling
          const chatInsertResult = await db.prepare(`
            INSERT INTO chats (id, listing_id, buyer_id, seller_id, created_at, last_message_at) 
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            actualChatId,
            parseInt(listingId) || listingId, // Try to convert to integer if possible
            currentUserId, 
            otherUserActualId, 
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000)
          ).run();
          
          console.log('✅ New chat created successfully');
          console.log('Chat insert result:', chatInsertResult);
          
        } catch (insertError) {
          console.error('❌ Error creating chat:', insertError);
          
          // Let's get more details about the constraint failure
          try {
            const constraintInfo = await db.prepare(`
              PRAGMA foreign_key_list(chats)
            `).all();
            console.log('Foreign key constraints for chats table:', constraintInfo.results);
          } catch (pragmaError) {
            console.log('Could not get foreign key info:', pragmaError);
          }
          
          return NextResponse.json({ 
            error: 'chat_creation_failed',
            message: 'Failed to create chat due to database constraint',
            details: String(insertError)
          }, { status: 500 });
        }
      }
    }
    
    if (!actualChatId) {
      return NextResponse.json({ error: "failed to create or find chat" }, { status: 500 });
    }
    
    // Insert the message
    const messageId = generateMessageId();
    console.log('Inserting message:', messageId);
    
    try {
      await db.prepare(`
        INSERT INTO messages (id, chat_id, from_id, text, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        messageId,
        actualChatId, 
        currentUserId, 
        text.trim(), 
        Math.floor(Date.now() / 1000)
      ).run();
      
      console.log('✅ Message inserted successfully');
    } catch (messageError) {
      console.error('❌ Error inserting message:', messageError);
      return NextResponse.json({ 
        error: 'message_insertion_failed',
        message: 'Failed to insert message due to database constraint',
        details: String(messageError)
      }, { status: 500 });
    }
    
    // Update chat's last_message_at
    try {
      await db.prepare(`
        UPDATE chats 
        SET last_message_at = ? 
        WHERE id = ?
      `).bind(Math.floor(Date.now() / 1000), actualChatId).run();
      
      console.log('✅ Chat timestamp updated successfully');
    } catch (updateError) {
      console.error('❌ Error updating chat timestamp:', updateError);
      // Don't fail the entire request for this, just log it
    }
    
    console.log('🎉 Message sent successfully!');
    
    return NextResponse.json({ 
      ok: true, 
      messageId, 
      chatId: actualChatId,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('=== CHAT SEND API ERROR ===');
    console.error('Error in chat send API:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
