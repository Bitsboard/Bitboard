/**
 * Migration script to populate structured location fields for existing listings
 * This script should be run after the database migration to backfill existing data
 */

const { parseLocation } = require('../src/lib/locationParser');

async function migrateLocationData() {
  console.log('🔄 Starting location data migration...');
  
  // This would typically connect to your database
  // For now, this is a template for the migration logic
  
  try {
    // 1. Get all listings with location data but missing structured fields
    const listings = await db.prepare(`
      SELECT id, location 
      FROM listings 
      WHERE location IS NOT NULL 
      AND (city IS NULL OR state_province IS NULL OR country IS NULL OR country_code IS NULL)
    `).all();
    
    console.log(`📊 Found ${listings.results.length} listings to migrate`);
    
    // 2. Process each listing
    for (const listing of listings.results) {
      const parsed = parseLocation(listing.location);
      
      // 3. Update the listing with structured data
      await db.prepare(`
        UPDATE listings 
        SET 
          city = ?,
          state_province = ?,
          country = ?,
          country_code = ?
        WHERE id = ?
      `).bind(
        parsed.city,
        parsed.stateProvince,
        parsed.country,
        parsed.countryCode,
        listing.id
      ).run();
      
      console.log(`✅ Migrated listing ${listing.id}: ${listing.location} -> ${parsed.city}, ${parsed.stateProvince}, ${parsed.country}`);
    }
    
    console.log('🎉 Location data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { migrateLocationData };

// Run if called directly
if (require.main === module) {
  migrateLocationData().catch(console.error);
}
