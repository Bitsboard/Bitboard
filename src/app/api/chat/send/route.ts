import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

// Generate a unique chat ID based on userA, userB, and listing
function generateChatId(userA: string, userB: string, listingId: string): string {
  // Sort users alphabetically to ensure consistent chat ID regardless of who initiates
  const [firstUser, secondUser] = [userA, userB].sort();
  return `chat_${firstUser}_${secondUser}_${listingId}_${Date.now()}`;
}

// Generate a unique message ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    
    // Ensure chat schema exists
    await ensureChatSchema(db);
    
    let actualChatId = chatId;
    
    // If no chatId provided, find or create a new chat
    if (!actualChatId) {
      console.log('Finding or creating chat...');
      
      // Check if chat already exists for this user pair and listing
      const existingChat = await db.prepare(`
        SELECT id FROM chats 
        WHERE listing_id = ? AND 
        ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      `).bind(listingId, userEmail, otherUserId, otherUserId, userEmail).all();
      
      if (existingChat.results && existingChat.results.length > 0) {
        actualChatId = existingChat.results[0].id as string;
        console.log('Using existing chat:', actualChatId);
      } else {
        // Create new chat with unique ID
        actualChatId = generateChatId(userEmail, otherUserId, listingId);
        console.log('Creating new chat with ID:', actualChatId);
        
        await db.prepare(`
          INSERT INTO chats (id, listing_id, buyer_id, seller_id, created_at, last_message_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          actualChatId,
          listingId, 
          userEmail, 
          otherUserId, 
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000)
        ).run();
        
        console.log('New chat created successfully');
      }
    }
    
    if (!actualChatId) {
      return NextResponse.json({ error: "failed to create or find chat" }, { status: 500 });
    }
    
    // Insert the message
    const messageId = generateMessageId();
    console.log('Inserting message:', messageId);
    
    await db.prepare(`
      INSERT INTO messages (id, chat_id, from_id, text, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      messageId,
      actualChatId, 
      userEmail, 
      text.trim(), 
      Math.floor(Date.now() / 1000)
    ).run();
    
    // Update chat's last_message_at
    await db.prepare(`
      UPDATE chats 
      SET last_message_at = ? 
      WHERE id = ?
    `).bind(Math.floor(Date.now() / 1000), actualChatId).run();
    
    console.log('Message sent successfully');
    
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
