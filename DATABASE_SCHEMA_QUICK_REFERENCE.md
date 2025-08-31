# Database Schema Quick Reference

## Table Summary

| Table              | Purpose           | Primary Key          | Records | Description                                       |
| ------------------ | ----------------- | -------------------- | ------- | ------------------------------------------------- |
| **users**          | User accounts     | `id` (TEXT, 8 chars) | 0       | User profiles, authentication, thumbs up, balance |
| **listings**       | Marketplace items | `id` (INTEGER, auto) | 0       | Products, services, wants/offers                  |
| **chats**          | Conversations     | `id` (TEXT)          | 0       | Chat sessions between users                       |
| **messages**       | Chat content      | `id` (TEXT)          | 0       | Individual chat messages                          |
| **saved_searches** | User preferences  | `id` (TEXT)          | 0       | Saved search criteria                             |
| **listing_images** | Multiple images   | `id` (TEXT)          | 0       | Additional listing photos                         |
| **view_logs**      | Analytics         | `id` (TEXT)          | 0       | Listing view tracking                             |

## Key Relationships

```
users ←→ listings (posted_by)
users ←→ chats (buyer_id/seller_id)
users ←→ messages (from_id)
users ←→ saved_searches (user_id)

listings ←→ chats (listing_id)
listings ←→ listing_images (listing_id)
listings ←→ view_logs (listing_id)

chats ←→ messages (chat_id)
```

## Current Status

✅ **All tables exist and are empty**
✅ **Schema structure updated**
✅ **Foreign key relationships intact**
✅ **Indexes maintained**
✅ **Constraints active**
✅ **Escrow table removed**
✅ **Users table updated with thumbs_up and balance**
✅ **Listings table supports multiple images and Make Offer pricing**

## Quick Commands

```bash
# Check table counts
wrangler d1 execute bitsbarter-staging --command="SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'listings', COUNT(*) FROM listings UNION ALL SELECT 'chats', COUNT(*) FROM chats UNION ALL SELECT 'messages', COUNT(*) FROM messages UNION ALL SELECT 'saved_searches', COUNT(*) FROM saved_searches UNION ALL SELECT 'listing_images', COUNT(*) FROM listing_images UNION ALL SELECT 'view_logs', COUNT(*) FROM view_logs;"

# View table schema
wrangler d1 execute bitsbarter-staging --command="PRAGMA table_info(users);"

# Check indexes
wrangler d1 execute bitsbarter-staging --command="SELECT name FROM sqlite_master WHERE type='index';"
```

---

**Database:** bitsbarter-staging  
**Status:** ✅ READY FOR DEVELOPMENT  
**Last Updated:** $(date)
