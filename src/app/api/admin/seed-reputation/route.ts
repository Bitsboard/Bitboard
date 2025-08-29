export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('🔧 Admin Seed Reputation API: Starting realistic reputation seeding...');
    
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
    console.log('🔍 Checking current reputation state...');
    const currentState = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN rating = 0 THEN 1 ELSE 0 END) as users_with_zero_rating,
        SUM(CASE WHEN rating > 0 THEN 1 ELSE 0 END) as users_with_positive_rating,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        AVG(rating) as avg_rating
      FROM users
    `).all();
    
    console.log('📊 Current reputation state:', currentState.results?.[0]);
    
    // Step 2: Apply realistic reputation seeding
    console.log('🔄 Seeding realistic reputation values...');
    
    // Generate random reputation for ALL seeded users (1-100 range)
    // This creates a realistic distribution where most users have moderate reputation
    // and some have higher reputation based on their activity
    
    // Get all usernames from the database
    const allUsers = await db.prepare(`
      SELECT username, verified FROM users ORDER BY username
    `).all();
    
    console.log(`📊 Found ${allUsers.results?.length || 0} users to seed with reputation`);
    
    // Seed each user with a random realistic reputation
    for (const user of (allUsers.results || [])) {
      let reputation: number;
      
      if (user.verified) {
        // Verified users get higher reputation (20-100)
        reputation = Math.floor(Math.random() * 81) + 20;
      } else {
        // Non-verified users get lower reputation (1-50)
        reputation = Math.floor(Math.random() * 50) + 1;
      }
      
      // Update the user's reputation
      await db.prepare(`
        UPDATE users SET rating = ? WHERE username = ?
      `).bind(reputation, user.username).run();
      
      console.log(`✅ ${user.username} (${user.verified ? 'verified' : 'unverified'}): +${reputation} 👍`);
    }
    
    console.log('✅ Reputation seeding completed');
    
    // Step 3: Verify the changes
    console.log('🔍 Verifying the reputation seeding...');
    const finalState = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN rating = 0 THEN 1 ELSE 0 END) as users_with_zero_rating,
        SUM(CASE WHEN rating > 0 THEN 1 ELSE 0 END) as users_with_positive_rating,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        AVG(rating) as avg_rating
      FROM users
    `).all();
    
    console.log('📊 Final reputation state:', finalState.results?.[0]);
    
    // Step 4: Get sample of users with their new ratings
    const sampleUsers = await db.prepare(`
      SELECT 
        username,
        verified,
        rating,
        CASE 
          WHEN rating >= 10 THEN 'High Reputation'
          WHEN rating >= 5 THEN 'Good Reputation'
          WHEN rating >= 2 THEN 'Decent Reputation'
          ELSE 'New User'
        END as reputation_level
      FROM users 
      ORDER BY rating DESC, username
      LIMIT 10
    `).all();
    
    console.log('👥 Sample users with new ratings:', sampleUsers.results);
    
    // Step 5: Summary
    console.log('🎉 Reputation seeding completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Realistic reputation values seeded successfully',
      summary: {
        totalUsers: finalState.results?.[0]?.total_users || 0,
        usersWithZeroRating: finalState.results?.[0]?.users_with_zero_rating || 0,
        usersWithPositiveRating: finalState.results?.[0]?.users_with_positive_rating || 0,
        minRating: finalState.results?.[0]?.min_rating || 0,
        maxRating: finalState.results?.[0]?.max_rating || 0,
        avgRating: finalState.results?.[0]?.avg_rating || 0
      },
      sampleUsers: sampleUsers.results || [],
      details: {
        reputationSystemNowRealistic: true,
        nextSteps: 'Reputation displays should now show realistic thumbs-up counts like +12 👍, +7 👍, etc.'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error seeding reputation:', error);
    
    return NextResponse.json({ 
      error: 'Failed to seed reputation',
      details: error?.message || String(error) || 'Unknown error',
      stack: error?.stack || 'No stack trace available'
    }, { status: 500 });
  }
}
