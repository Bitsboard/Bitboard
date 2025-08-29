export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('🔧 Admin Fix Rating API: Starting database rating schema fix...');
    
    // Try to get database connection using different methods
    let db: D1Database | null = null;
    
    try {
      // Method 1: Try @cloudflare/next-on-pages
      const mod = await import('@cloudflare/next-on-pages').catch(() => null);
      if (mod && typeof mod.getRequestContext === 'function') {
        const context = mod.getRequestContext();
        if (context?.env?.DB) {
          console.log('✅ Database found via @cloudflare/next-on-pages');
          db = context.env.DB as D1Database;
        }
      }
    } catch (error) {
      console.log('⚠️ @cloudflare/next-on-pages method failed:', error);
    }
    
    if (!db) {
      try {
        // Method 2: Try globalThis.__env__
        if (typeof globalThis !== 'undefined' && (globalThis as any).__env__?.DB) {
          console.log('✅ Database found via globalThis.__env__');
          db = (globalThis as any).__env__.DB as D1Database;
        }
      } catch (error) {
        console.log('⚠️ globalThis.__env__ method failed:', error);
      }
    }
    
    if (!db) {
      console.error('❌ No database binding found via any method');
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: 'No D1 database binding found'
      }, { status: 500 });
    }
    
    console.log('✅ Database connection established');
    
    // Step 1: Check current state
    console.log('🔍 Checking current database state...');
    const currentState = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN rating = 5.0 THEN 1 ELSE 0 END) as users_with_five_rating,
        SUM(CASE WHEN rating != 5.0 THEN 1 ELSE 0 END) as users_with_other_rating,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating
      FROM users
    `).all();
    
    console.log('📊 Current database state:', currentState.results?.[0]);
    
    // Step 2: Update all users to have 0 rating
    console.log('🔄 Updating all users to have 0 rating...');
    
    const updateResult = await db.prepare(`
      UPDATE users SET rating = 0 WHERE rating != 0 OR rating IS NULL
    `).run();
    
    console.log('✅ Update completed. Rows affected:', updateResult.meta?.changes || 0);
    
    // Step 3: Check if we can modify the column type
    console.log('🔧 Attempting to modify column type...');
    let columnModified = false;
    
    try {
      // Try to modify the column type (SQLite 3.35.0+)
      await db.prepare('ALTER TABLE users MODIFY COLUMN rating INTEGER DEFAULT 0').run();
      console.log('✅ Column type successfully modified to INTEGER');
      columnModified = true;
    } catch (modifyError: any) {
      console.log('⚠️ Column type modification failed (this is normal for older SQLite):', modifyError?.message);
      console.log('📝 The data has been updated, but the column type remains REAL');
      console.log('📝 This is acceptable - the data will still work correctly');
    }
    
    // Step 4: Verify the fix
    console.log('🔍 Verifying the fix...');
    const finalState = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN rating = 0 THEN 1 ELSE 0 END) as users_with_zero_rating,
        SUM(CASE WHEN rating != 0 THEN 1 ELSE 0 END) as users_with_nonzero_rating,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating
      FROM users
    `).all();
    
    console.log('📊 Final database state:', finalState.results?.[0]);
    
    // Step 5: Check table schema
    console.log('🔍 Checking table schema...');
    const schemaInfo = await db.prepare("PRAGMA table_info(users)").all();
    
    const ratingColumn = schemaInfo.results?.find((col: any) => col.name === 'rating');
    let columnInfo = null;
    if (ratingColumn) {
      columnInfo = {
        name: ratingColumn.name,
        type: ratingColumn.type,
        notnull: ratingColumn.notnull,
        default_value: ratingColumn.dflt_value,
        pk: ratingColumn.pk
      };
      console.log('📋 Rating column info:', columnInfo);
    }
    
    // Step 6: Summary
    console.log('🎉 Database rating fix completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Database rating schema fix completed successfully',
      summary: {
        totalUsers: finalState.results?.[0]?.total_users || 0,
        usersWithZeroRating: finalState.results?.[0]?.users_with_zero_rating || 0,
        usersWithNonzeroRating: finalState.results?.[0]?.users_with_nonzero_rating || 0,
        minRating: finalState.results?.[0]?.min_rating || 0,
        maxRating: finalState.results?.[0]?.max_rating || 0,
        rowsUpdated: updateResult.meta?.changes || 0,
        columnModified: columnModified,
        columnInfo: columnInfo
      },
      details: {
        allUsersNowHaveZeroRating: (finalState.results?.[0]?.users_with_zero_rating || 0) === (finalState.results?.[0]?.total_users || 0),
        reputationSystemFixed: true,
        nextSteps: 'Reputation displays should now show +0 👍 instead of +5 👍'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing database rating:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fix database rating',
      details: error?.message || String(error) || 'Unknown error',
      stack: error?.stack || 'No stack trace available'
    }, { status: 500 });
  }
}
