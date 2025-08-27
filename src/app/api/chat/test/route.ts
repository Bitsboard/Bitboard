import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET() {
  try {
    console.log('=== CHAT TEST API CALLED ===');
    
    // Test 1: Get database connection
    console.log('1. Testing database connection...');
    const db = await getD1();
    if (!db) {
      console.log('❌ No database binding found');
      return NextResponse.json({ 
        error: 'no_db_binding',
        step: 'getD1',
        message: 'Database binding not available'
      }, { status: 500 });
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Check if tables exist
    console.log('2. Checking existing tables...');
    try {
      const tablesResult = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND (name='chats' OR name='messages')
        ORDER BY name
      `).all();
      console.log('Tables found:', tablesResult.results);
    } catch (error) {
      console.log('❌ Error checking tables:', error);
    }
    
    // Test 3: Ensure schema
    console.log('3. Ensuring chat schema...');
    try {
      await ensureChatSchema(db);
      console.log('✅ Chat schema ensured');
    } catch (error) {
      console.log('❌ Error ensuring schema:', error);
      return NextResponse.json({ 
        error: 'schema_error',
        step: 'ensureChatSchema',
        message: String(error)
      }, { status: 500 });
    }
    
    // Test 4: Check tables after schema creation
    console.log('4. Checking tables after schema creation...');
    try {
      const tablesAfterResult = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND (name='chats' OR name='messages')
        ORDER BY name
      `).all();
      console.log('Tables after schema creation:', tablesAfterResult.results);
      
      // Test 5: Check table structure
      if (tablesAfterResult.results && tablesAfterResult.results.length > 0) {
        console.log('5. Checking table structure...');
        for (const table of tablesAfterResult.results) {
          const structureResult = await db.prepare(`PRAGMA table_info(${table.name})`).all();
          console.log(`Structure of ${table.name}:`, structureResult.results);
        }
      }
    } catch (error) {
      console.log('❌ Error checking tables after schema:', error);
    }
    
    // Test 6: Try a simple insert (will be rolled back)
    console.log('6. Testing simple insert...');
    try {
      const testChatId = `test_${Date.now()}`;
      await db.prepare(`
        INSERT INTO chats (id, listing_id, buyer_id, seller_id, created_at, last_message_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        testChatId,
        999, // test listing ID
        'test@buyer.com',
        'test@seller.com',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      ).run();
      console.log('✅ Test insert successful');
      
      // Clean up test data
      await db.prepare('DELETE FROM chats WHERE id = ?').bind(testChatId).run();
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('❌ Error with test insert:', error);
      return NextResponse.json({ 
        error: 'insert_test_failed',
        step: 'test_insert',
        message: String(error)
      }, { status: 500 });
    }
    
    console.log('=== ALL TESTS PASSED ===');
    return NextResponse.json({ 
      success: true,
      message: 'All database tests passed',
      database: 'connected',
      schema: 'ready'
    });
    
  } catch (error) {
    console.error('=== CHAT TEST API ERROR ===');
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'unexpected_error',
      step: 'unknown',
      message: String(error)
    }, { status: 500 });
  }
}
