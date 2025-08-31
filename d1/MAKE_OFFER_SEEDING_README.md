# Make Offer Listings - Seeding Guide

This guide explains how to seed the database with "make offer" listings to demonstrate the new flexible pricing system.

## Files Created

### 1. `0015_add_pricing_type.sql` - Database Migration
- **Purpose**: Adds the `pricing_type` field to the listings table
- **Usage**: Run this first to update the database schema
- **Command**: `wrangler d1 execute bitsbarter-staging --file=d1/migrations/0015_add_pricing_type.sql`

### 2. `seed_make_offer_listings.sql` - Update Existing Listings
- **Purpose**: Converts some existing listings to use "make offer" pricing
- **What it does**:
  - Updates want ads with `price_sat = 0` to use make offer pricing
  - Converts some unique/rare items to make offer for variety
  - Updates some high-value items to demonstrate negotiation benefits
- **Usage**: Run after the migration to update existing data
- **Command**: `wrangler d1 execute bitsbarter-staging --file=d1/seed_make_offer_listings.sql`

### 3. `seed_make_offer_examples.sql` - Add New Examples
- **Purpose**: Adds completely new listings that demonstrate make offer pricing
- **Examples include**:
  - Custom services (mining setup design, legal services)
  - Unique items (vintage Bitcoin art, luxury properties)
  - High-value equipment (industrial mining farms, custom vehicles)
- **Usage**: Run to add new example listings
- **Command**: `wrangler d1 execute bitsbarter-staging --file=d1/seed_make_offer_examples.sql`

## Execution Order

1. **First**: Run the migration to add the pricing_type field
2. **Second**: Update existing listings to use make offer pricing
3. **Third**: Add new example listings

## Complete Setup Command

```bash
# Run all three files in sequence
wrangler d1 execute bitsbarter-staging --file=d1/migrations/0015_add_pricing_type.sql
wrangler d1 execute bitsbarter-staging --file=d1/seed_make_offer_listings.sql
wrangler d1 execute bitsbarter-staging --file=d1/seed_make_offer_examples.sql
```

## What You'll See

After running these files, you'll have:
- **Fixed Price Listings**: Traditional listings with specific prices in satoshis
- **Make Offer Listings**: Listings showing "Make Offer" instead of a price
- **Mixed Categories**: Both sell and want ads using make offer pricing
- **Real Examples**: Practical use cases for when make offer pricing makes sense

## Benefits Demonstrated

1. **Flexibility**: Sellers can list items without setting fixed prices
2. **Negotiation**: Encourages buyer-seller communication
3. **Unique Items**: Perfect for rare, custom, or high-value items
4. **Services**: Ideal for consulting and custom work
5. **Want Ads**: Buyers can express interest without committing to specific prices

## Verification

Each seed file includes verification queries to show:
- How many listings were updated/added
- Examples of the new make offer listings
- Distribution of pricing types across categories

## Notes

- Make offer listings use `price_sat = -1` as a special indicator
- The UI automatically displays "Make Offer" for these listings
- Users can still filter and search these listings normally
- The system maintains all existing functionality while adding new options
