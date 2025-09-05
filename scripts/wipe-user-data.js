const { execSync } = require('child_process');

async function wipeUserData() {
  const email = 'georged1997@gmail.com';
  
  try {
    console.log(`🗑️  Wiping data for user: ${email}`);
    
    // Get the user ID first
    const getUserQuery = `SELECT id FROM users WHERE email = '${email}'`;
    console.log('🔍 Finding user ID...');
    
    const userResult = execSync(`wrangler d1 execute bitsbarter-staging --remote --command "${getUserQuery}"`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log('User query result:', userResult);
    
    // Parse the result to get user ID
    const userMatch = userResult.match(/"id":"([^"]+)"/);
    if (!userMatch) {
      console.log('❌ User not found in database');
      return;
    }
    
    const userId = userMatch[1];
    console.log(`👤 Found user ID: ${userId}`);
    
    // Delete in order to respect foreign key constraints
    const deleteQueries = [
      // Delete offers where user is involved
      `DELETE FROM offers WHERE from_user_id = '${userId}' OR to_user_id = '${userId}'`,
      
      // Delete messages
      `DELETE FROM messages WHERE from_id = '${userId}'`,
      
      // Delete chats where user is involved
      `DELETE FROM chats WHERE user1_id = '${userId}' OR user2_id = '${userId}'`,
      
      // Delete user blocks
      `DELETE FROM user_blocks WHERE blocker_id = '${userId}' OR blocked_id = '${userId}'`,
      
      // Delete hidden conversations
      `DELETE FROM hidden_conversations WHERE user_id = '${userId}'`,
      
      // Delete saved searches
      `DELETE FROM saved_searches WHERE user_id = '${userId}'`,
      
      // Delete view logs
      `DELETE FROM view_logs WHERE user_id = '${userId}'`,
      
      // Delete listing images for user's listings
      `DELETE FROM listing_images WHERE listing_id IN (SELECT id FROM listings WHERE posted_by = '${userId}')`,
      
      // Delete listings
      `DELETE FROM listings WHERE posted_by = '${userId}'`,
      
      // Finally delete the user
      `DELETE FROM users WHERE id = '${userId}'`
    ];
    
    for (const query of deleteQueries) {
      try {
        console.log(`🗑️  Executing: ${query.substring(0, 50)}...`);
        const result = execSync(`wrangler d1 execute bitsbarter-staging --remote --command "${query}"`, { 
          encoding: 'utf8',
          cwd: process.cwd()
        });
        console.log('✅ Query executed successfully');
      } catch (error) {
        console.log(`⚠️  Query failed (might be expected): ${error.message}`);
      }
    }
    
    console.log('✅ User data wipe completed');
    
  } catch (error) {
    console.error('❌ Error wiping user data:', error);
  }
}

wipeUserData();
