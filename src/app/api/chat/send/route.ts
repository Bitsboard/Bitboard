import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

// Generate a unique ID for chats and messages
function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(req: Request) {
  try {
    // Simple test to see if we even reach this point
    console.log('=== CHAT SEND API REACHED ===');
    
    // Test basic functionality
    const testResponse = { test: 'API route is working' };
    console.log('Test response:', testResponse);
    
    // For now, just return success to test if the route works at all
    return NextResponse.json({ 
      ok: true, 
      test: 'API route reached successfully',
      timestamp: Date.now()
    });
    
    // Comment out the rest for now to isolate the issue
    /*
    console.log('Chat send API called');
    
    const { chatId, text, listingId, otherUserId, userEmail } = await req.json() as { 
      chatId?: string; 
      text?: string; 
      listingId?: string;
      otherUserId?: string;
      userEmail?: string;
    };
    
    console.log('Request data:', { chatId, text, listingId, otherUserId, userEmail });
    
    // Simple authentication - check if userEmail is provided
    if (!userEmail) {
      console.log('No userEmail provided');
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }
    
    if (!text || !text.trim()) {
      console.log('No text provided');
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    console.log('Getting D1 database...');
    const db = await getD1();
    if (!db) {
      console.log('No database binding found');
      return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    }
    
    console.log('Ensuring chat schema...');
    await ensureChatSchema(db);
    console.log('Chat schema ensured');
    
    let actualChatId = chatId;
    
    // If no chatId provided, create a new chat
    if (!actualChatId) {
      console.log('No chatId, creating new chat...');
      if (!listingId || !otherUserId) {
        console.log('Missing listingId or otherUserId');
        return NextResponse.json({ error: "listingId and otherUserId required for new chat" }, { status: 400 });
      }
      
      // Check if chat already exists
      console.log('Checking for existing chat...');
      const existingChat = await db.prepare(`
        SELECT id FROM chats 
        WHERE listing_id = ? AND 
        ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      `).bind(listingId, userEmail, otherUserId, otherUserId, userEmail).all();
      
      console.log('Existing chat query result:', existingChat);
      
      if (existingChat.results && existingChat.results.length > 0) {
        actualChatId = existingChat.results[0].id as string;
        console.log('Using existing chat:', actualChatId);
      } else {
        // Create new chat with generated ID
        const newChatId = generateId();
        console.log('Creating new chat with ID:', newChatId);
        
        const chatInsertResult = await db.prepare(`
          INSERT INTO chats (id, listing_id, buyer_id, seller_id, created_at, last_message_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          newChatId,
          listingId, 
          userEmail, 
          otherUserId, 
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000)
        ).run();
        
        console.log('Chat insert result:', chatInsertResult);
        actualChatId = newChatId;
      }
    }
    
    if (!actualChatId) {
      console.log('Failed to get actualChatId');
      return NextResponse.json({ error: "failed to create or find chat" }, { status: 500 });
    }
    
    console.log('Inserting message with chatId:', actualChatId);
    
    // Insert the message with generated ID
    const messageId = generateId();
    const messageInsertResult = await db.prepare(`
      INSERT INTO messages (id, chat_id, from_id, text, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      messageId,
      actualChatId, 
      userEmail, 
      text.trim(), 
      Math.floor(Date.now() / 1000)
    ).run();
    
    console.log('Message insert result:', messageInsertResult);
    
    // Update chat's last_message_at
    console.log('Updating chat last_message_at...');
    const updateResult = await db.prepare(`
      UPDATE chats 
      SET last_message_at = ? 
      WHERE id = ?
    `).bind(Math.floor(Date.now() / 1000), actualChatId).run();
    
    console.log('Update result:', updateResult);
    
    console.log('Success! Returning response...');
    return NextResponse.json({ 
      ok: true, 
      messageId, 
      chatId: actualChatId 
    });
    */
    
  } catch (error) {
    console.error('=== CHAT SEND API ERROR ===');
    console.error('Error in chat send API:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
