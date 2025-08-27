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
    
    // Step 4: Test database connection
    console.log('Step 4: Testing database connection...');
    try {
      const db = await getD1();
      if (!db) {
        console.log('❌ No database binding found');
        return NextResponse.json({ 
          error: 'no_db_binding',
          step: 'database_connection',
          message: 'Database binding not available'
        }, { status: 500 });
      }
      console.log('✅ Database connection successful');
      
      // Step 5: Test basic database operations
      console.log('Step 5: Testing basic database operations...');
      try {
        // Test a simple query to see if the database is responsive
        const testQuery = await db.prepare('SELECT 1 as test').all();
        console.log('✅ Basic database query successful:', testQuery);
        
        // Test if we can access the database name/info
        const dbInfo = await db.prepare('PRAGMA database_list').all();
        console.log('✅ Database info retrieved:', dbInfo);
        
      } catch (dbError) {
        console.log('❌ Basic database operations failed:', dbError);
        return NextResponse.json({ 
          error: 'database_operations_failed',
          step: 'basic_db_test',
          message: String(dbError)
        }, { status: 500 });
      }
      
    } catch (dbConnectionError) {
      console.log('❌ Database connection error:', dbConnectionError);
      return NextResponse.json({ 
        error: 'database_connection_failed',
        step: 'getD1',
        message: String(dbConnectionError)
      }, { status: 500 });
    }
    
    // For now, return success with database status to test this step
    return NextResponse.json({ 
      ok: true, 
      test: 'Database connection and basic operations successful',
      parsedData: { chatId, text, listingId, otherUserId, userEmail },
      databaseStatus: 'connected_and_working',
      timestamp: Date.now()
    });
    
    // TODO: Add schema creation and chat logic back step by step
    
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
