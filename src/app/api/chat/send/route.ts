import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

// Generate a unique ID for chats and messages
function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(req: Request) {
  try {
    console.log('=== CHAT SEND API REACHED ===');
    
    // Step 1: Test request parsing
    console.log('Step 1: Parsing request body...');
    const body = await req.json();
    console.log('Request body parsed successfully:', body);
    
    const { chatId, text, listingId, otherUserId, userEmail } = body as { 
      chatId?: string; 
      text?: string; 
      listingId?: string;
      otherUserId?: string;
      userEmail?: string;
    };
    
    console.log('Step 2: Extracted data:', { chatId, text, listingId, otherUserId, userEmail });
    
    // Step 3: Basic validation
    if (!userEmail) {
      console.log('❌ No userEmail provided');
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }
    
    if (!text || !text.trim()) {
      console.log('❌ No text provided');
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    
    console.log('✅ Basic validation passed');
    
    // For now, return success with parsed data to test this step
    return NextResponse.json({ 
      ok: true, 
      test: 'Request parsing and validation successful',
      parsedData: { chatId, text, listingId, otherUserId, userEmail },
      timestamp: Date.now()
    });
    
    // TODO: Add database logic back step by step
    
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
