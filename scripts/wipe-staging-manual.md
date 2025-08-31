# Manual Staging Database Wipe

If you prefer to run the commands manually instead of using the automated script, follow these steps:

## Prerequisites

- Ensure you have `wrangler` CLI installed
- Make sure you're in the project root directory
- Verify you're working with the staging database

## Step 1: Verify Current Database Configuration

```bash
# Check your wrangler.jsonc configuration
cat wrangler.jsonc
```

You should see:

- Staging: `bitsbarter-staging` (d5ed8250-15da-4131-8b78-c364a40515f4)
- Production: `bitsbarter-prod` (8c9de8f7-451b-4c90-b92c-5cd447907d46)

## Step 2: Wipe the Staging Database

```bash
# Execute the wipe script
wrangler d1 execute bitsbarter-staging --file=./d1/wipe_staging_db.sql
```

## Step 3: Verify Database is Empty

```bash
# Check all table counts
wrangler d1 execute bitsbarter-staging --command="SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'listings', COUNT(*) FROM listings UNION ALL SELECT 'chats', COUNT(*) FROM chats UNION ALL SELECT 'messages', COUNT(*) FROM messages UNION ALL SELECT 'escrow', COUNT(*) FROM escrow UNION ALL SELECT 'saved_searches', COUNT(*) FROM saved_searches;"
```

All counts should return 0.

## Step 4: Remove Seed Data Files (Optional)

```bash
# Remove all seed data files
rm d1/seed_*.sql
rm d1/seed_batch_*.sql
rm d1/seed_staging*.sql
rm d1/seed_north_america.sql
rm d1/seed_listings_north_america.sql
rm d1/seed_large_listings.sql
rm d1/seed_make_offer*.sql
rm d1/seed_realistic_reputation.sql
rm d1/seed_final_make_offer.sql

# Remove test and fix files
rm d1/test_*.sql
rm d1/fix_*.sql
rm d1/restore_*.sql
rm d1/cleanup_*.sql
rm d1/audit_*.sql
```

## Step 5: Final Verification

```bash
# Verify the cleanup
wrangler d1 execute bitsbarter-staging --command="SELECT 'Database Status' as info, 'CLEAN' as status;"
```

## Important Notes

- This only affects the STAGING database
- Production database remains untouched
- The database schema is preserved
- Only data is removed, not the table structure
- All foreign key relationships are maintained

## Troubleshooting

If you encounter errors:

1. Check that wrangler is installed: `wrangler --version`
2. Verify you're authenticated: `wrangler whoami`
3. Check database permissions: `wrangler d1 list`
4. Ensure you're in the correct project directory
