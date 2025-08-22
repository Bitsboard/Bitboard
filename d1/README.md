# bitsbarter Database Setup & Seeding

This directory contains the database schema, seeding scripts, and audit tools for the bitsbarter staging and production databases.

## 📁 Files Overview

- **`0001_init.sql`** - Initial database schema creation
- **`0002_add_missing_columns.sql`** - Additional columns and tables
- **`seed_staging.sql`** - Enhanced staging database seeding
- **`audit_staging.sql`** - Comprehensive database audit script
- **`test_connection.sql`** - Simple connection test

## 🚀 Quick Start

### 1. Apply Schema

Run the schema files in order against your D1 database:

```sql
-- First, apply the initial schema
-- Copy and paste the contents of 0001_init.sql into your D1 dashboard

-- Then apply additional columns (if needed)
-- Copy and paste the contents of 0002_add_missing_columns.sql
```

### 2. Seed the Database

Apply the enhanced seeding data:

```sql
-- Copy and paste the contents of seed_staging.sql into your D1 dashboard
```

### 3. Test Connection

Verify everything is working:

```sql
-- Copy and paste the contents of test_connection.sql
```

### 4. Run Full Audit

Perform comprehensive database verification:

```sql
-- Copy and paste the contents of audit_staging.sql
```

## 🗄️ Database Schema

### Users Table

- **id**: Unique user identifier
- **email**: User's email address (unique)
- **username**: Display username (unique)
- **sso**: Single sign-on provider
- **verified**: Email verification status
- **is_admin**: Admin privileges flag
- **banned**: Account ban status
- **created_at**: Account creation timestamp
- **image**: Profile image URL
- **rating**: User rating (0.0-5.0)
- **deals**: Number of completed deals

### Listings Table

- **id**: Unique listing identifier
- **title**: Listing title (3-200 chars)
- **description**: Detailed description
- **category**: Product category
- **ad_type**: 'sell' or 'want'
- **location**: Human-readable location
- **lat/lng**: Geographic coordinates
- **image_url**: Primary image URL
- **price_sat**: Price in satoshis
- **posted_by**: User ID (foreign key)
- **boosted_until**: Boost expiration timestamp
- **created_at**: Listing creation timestamp
- **updated_at**: Last update timestamp
- **status**: Listing status

## 🌱 Seeding Strategy

### User Distribution

- **10 users** with varied profiles and ratings
- **Mixed verification status** (verified/unverified)
- **Realistic rating distribution** (4.0-4.9)
- **Varied deal counts** (1-47 deals)

### Listing Distribution

- **Total**: 50 listings
- **Per user**: 3-7 listings (varied distribution)
- **Categories**: Mining Gear, Electronics, Services, Home & Garden, Sports & Outdoors, Office, Games & Hobbies
- **Ad types**: 70% sell, 30% want
- **Price range**: 50k - 18M sats

### Content Quality

- **Long descriptions**: 200-500 characters each
- **Realistic details**: Includes condition, features, pickup preferences
- **Geographic diversity**: Multiple GTA locations
- **Professional images**: High-quality Unsplash photos

## 🔍 Audit Process

### 1. Connection Test

Run `test_connection.sql` to verify basic connectivity and table access.

### 2. Full Audit

Run `audit_staging.sql` to perform comprehensive verification:

- ✅ Table structure verification
- ✅ User data completeness
- ✅ Listing data quality
- ✅ Foreign key relationships
- ✅ Data consistency checks
- ✅ Content analysis
- ✅ Geographic distribution
- ✅ Health score calculation

### 3. Expected Results

After successful seeding, the audit should show:

- **Users**: 10 total users
- **Listings**: 50 total listings
- **Health Score**: "EXCELLENT - All checks passed"
- **Orphaned listings**: 0
- **Missing descriptions**: 0
- **Invalid coordinates**: 0

## 🚨 Common Issues & Solutions

### Issue: "Table not found"

**Solution**: Ensure schema files were applied in correct order

### Issue: "Foreign key constraint failed"

**Solution**: Verify users are seeded before listings

### Issue: "Database connection failed"

**Solution**: Check D1 binding configuration in wrangler.jsonc

### Issue: "Permission denied"

**Solution**: Verify database permissions in Cloudflare dashboard

## 📊 Monitoring & Maintenance

### Regular Checks

- Run audit script weekly
- Monitor for orphaned records
- Check data quality metrics

### Performance

- All queries use proper indexes
- Foreign keys ensure referential integrity
- Efficient geospatial queries

### Backup

- D1 provides automatic backups
- Consider manual exports for staging data

## 🔧 Customization

### Adding More Users

Follow the pattern in `seed_staging.sql`:

```sql
INSERT INTO users (id, email, username, sso, verified, created_at, image, rating, deals) VALUES
  ('user_new', 'new@example.com', 'newuser', 'google', 1, strftime('%s','now'), 'image_url', 4.5, 0);
```

### Adding More Listings

Ensure proper foreign key references:

```sql
INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, created_at) VALUES
  ('Title', 'Description', 'Category', 'sell', 'Location', 43.6532, -79.3832, 'image_url', 1000000, 'user_satoshi', strftime('%s','now'));
```

## 📈 Production Readiness

### Pre-Production Checklist

- [ ] Schema applied to production D1
- [ ] Seeding completed successfully
- [ ] Audit shows "EXCELLENT" health score
- [ ] All foreign key relationships verified
- [ ] Data quality checks passed
- [ ] Performance tested with expected load

### Production Considerations

- **Data volume**: Current seeding provides 50 listings, scale as needed
- **User growth**: Add users incrementally
- **Content moderation**: Implement review process for user-generated content
- **Backup strategy**: Leverage D1's built-in backup capabilities

## 🆘 Support

If you encounter issues:

1. **Check the audit script output** for specific error details
2. **Verify schema application** order and completeness
3. **Test basic connectivity** with `test_connection.sql`
4. **Review Cloudflare D1 logs** for detailed error messages

The database is designed to be robust and self-healing, with proper constraints and relationships ensuring data integrity.
