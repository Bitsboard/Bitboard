# Database Schema Documentation

## Overview

This document outlines the complete database schema for the Bitboard application. The database uses SQLite with D1 and includes all tables, columns, constraints, and relationships.

## Database Tables

### 1. **users** - User Accounts

**Primary Key:** `id` (TEXT, 8 alphanumeric characters)

| Column                | Type    | Not Null | Default                | Description                                    |
| --------------------- | ------- | -------- | ---------------------- | ---------------------------------------------- |
| `id`                  | TEXT    | ✅       | -                      | Unique 8-character user ID                     |
| `email`               | TEXT    | ✅       | -                      | User's email address (unique)                  |
| `username`            | TEXT    | ✅       | -                      | User's chosen username (unique)                |
| `sso`                 | TEXT    | ✅       | -                      | SSO provider (Google, Apple, Facebook)         |
| `verified`            | INTEGER | ❌       | 0                      | Verification status (0=unverified, 1=verified) |
| `is_admin`            | INTEGER | ❌       | 0                      | Admin privileges (0=user, 1=admin)             |
| `banned`              | INTEGER | ❌       | 0                      | Ban status (0=active, 1=banned)                |
| `created_at`          | INTEGER | ✅       | -                      | Account creation timestamp                     |
| `image`               | TEXT    | ❌       | -                      | Profile image URL                              |
| `thumbs_up`           | INTEGER | ❌       | 0                      | Number of thumbs up received                   |
| `deals`               | INTEGER | ❌       | 0                      | Number of completed deals                      |
| `last_active`         | INTEGER | ❌       | `strftime('%s','now')` | Last activity timestamp                        |
| `has_chosen_username` | INTEGER | ❌       | 0                      | Username selection flag                        |
| `balance`             | BIGINT  | ❌       | 0                      | User's balance in satoshis                     |

**Constraints:**

- `id` must be exactly 8 characters
- `email` must be unique
- `username` must be unique
- `thumbs_up` should be >= 0
- `deals` should be >= 0
- `balance` should be >= 0

---

### 2. **listings** - Marketplace Listings

**Primary Key:** `id` (INTEGER, auto-increment)

| Column          | Type    | Not Null | Default                | Description                 |
| --------------- | ------- | -------- | ---------------------- | --------------------------- |
| `id`            | INTEGER | ✅       | -                      | Auto-increment listing ID   |
| `title`         | TEXT    | ✅       | -                      | Listing title (3-200 chars) |
| `description`   | TEXT    | ❌       | ''                     | Listing description         |
| `category`      | TEXT    | ❌       | 'Misc'                 | Product category            |
| `ad_type`       | TEXT    | ❌       | 'sell'                 | Listing type (sell/want)    |
| `location`      | TEXT    | ❌       | ''                     | Location text               |
| `lat`           | REAL    | ❌       | 0                      | Latitude coordinate         |
| `lng`           | REAL    | ❌       | 0                      | Longitude coordinate        |
| `image_url`     | TEXT    | ❌       | ''                     | Primary image URL           |
| `price_sat`     | INTEGER | ✅       | -                      | Price in satoshis           |
| `pricing_type`  | TEXT    | ❌       | 'fixed'                | Pricing model               |
| `posted_by`     | TEXT    | ✅       | -                      | User ID who posted          |
| `boosted_until` | INTEGER | ❌       | -                      | Boost expiration timestamp  |
| `created_at`    | INTEGER | ✅       | `strftime('%s','now')` | Creation timestamp          |
| `updated_at`    | INTEGER | ❌       | `strftime('%s','now')` | Last update timestamp       |
| `status`        | TEXT    | ❌       | 'active'               | Listing status              |
| `views`         | INTEGER | ❌       | 0                      | View count                  |

**Constraints:**

- `title` length: 3-200 characters
- `category` must be valid category
- `ad_type` must be 'sell' or 'want'
- `lat` must be -90 to 90
- `lng` must be -180 to 180
- `price_sat` must be > 0
- `status` must be valid status
- `pricing_type` can be 'fixed', 'negotiable', or 'Make Offer'
- Foreign key: `posted_by` references `users(id)`

**Note:** Multiple images are supported through the `listing_images` table

---

### 3. **chats** - Chat Conversations

**Primary Key:** `id` (TEXT, unique identifier)

| Column            | Type    | Not Null | Default                | Description             |
| ----------------- | ------- | -------- | ---------------------- | ----------------------- |
| `id`              | TEXT    | ✅       | -                      | Unique chat identifier  |
| `listing_id`      | INTEGER | ✅       | -                      | Associated listing ID   |
| `buyer_id`        | TEXT    | ✅       | -                      | Buyer's user ID         |
| `seller_id`       | TEXT    | ✅       | -                      | Seller's user ID        |
| `created_at`      | INTEGER | ✅       | `strftime('%s','now')` | Chat creation timestamp |
| `last_message_at` | INTEGER | ❌       | `strftime('%s','now')` | Last message timestamp  |

**Constraints:**

- Foreign key: `listing_id` references `listings(id)`
- Foreign key: `buyer_id` references `users(id)`
- Foreign key: `seller_id` references `users(id)`

---

### 4. **messages** - Chat Messages

**Primary Key:** `id` (TEXT, unique identifier)

| Column       | Type    | Not Null | Default                | Description               |
| ------------ | ------- | -------- | ---------------------- | ------------------------- |
| `id`         | TEXT    | ✅       | -                      | Unique message identifier |
| `chat_id`    | TEXT    | ✅       | -                      | Associated chat ID        |
| `from_id`    | TEXT    | ✅       | -                      | Sender's user ID          |
| `text`       | TEXT    | ✅       | -                      | Message content           |
| `created_at` | INTEGER | ✅       | `strftime('%s','now')` | Message timestamp         |
| `read_at`    | INTEGER | ❌       | -                      | Read timestamp            |

**Constraints:**

- `text` length: 1-1000 characters
- Foreign key: `chat_id` references `chats(id)`
- Foreign key: `from_id` references `users(id)`

---

### 5. **saved_searches** - User Search Preferences

**Primary Key:** `id` (TEXT, unique identifier)

| Column        | Type    | Not Null | Default                | Description               |
| ------------- | ------- | -------- | ---------------------- | ------------------------- |
| `id`          | TEXT    | ✅       | -                      | Unique search identifier  |
| `user_id`     | TEXT    | ✅       | -                      | User who saved the search |
| `name`        | TEXT    | ✅       | -                      | Search name (1-100 chars) |
| `query`       | TEXT    | ❌       | -                      | Search query text         |
| `category`    | TEXT    | ❌       | -                      | Category filter           |
| `ad_type`     | TEXT    | ❌       | -                      | Ad type filter            |
| `center_lat`  | REAL    | ✅       | -                      | Search center latitude    |
| `center_lng`  | REAL    | ✅       | -                      | Search center longitude   |
| `radius_km`   | INTEGER | ✅       | -                      | Search radius in km       |
| `notify`      | BOOLEAN | ❌       | 1                      | Notification preference   |
| `last_opened` | INTEGER | ❌       | -                      | Last opened timestamp     |
| `created_at`  | INTEGER | ✅       | `strftime('%s','now')` | Creation timestamp        |

**Constraints:**

- `name` length: 1-100 characters
- `center_lat` must be -90 to 90
- `center_lng` must be -180 to 180
- `radius_km` must be 0-1000
- `ad_type` must be valid type
- Foreign key: `user_id` references `users(id)`

---

### 7. **listing_images** - Multiple Images per Listing

**Primary Key:** `id` (TEXT, unique identifier)

| Column        | Type    | Not Null | Default                | Description             |
| ------------- | ------- | -------- | ---------------------- | ----------------------- |
| `id`          | TEXT    | ✅       | -                      | Unique image identifier |
| `listing_id`  | TEXT    | ✅       | -                      | Associated listing ID   |
| `image_url`   | TEXT    | ✅       | -                      | Image URL               |
| `image_order` | INTEGER | ❌       | 0                      | Display order           |
| `created_at`  | INTEGER | ✅       | `strftime('%s','now')` | Creation timestamp      |

**Constraints:**

- Foreign key: `listing_id` references `listings(id)`

---

### 8. **view_logs** - Listing View Analytics

**Primary Key:** `id` (TEXT, unique identifier)

| Column           | Type    | Not Null | Default                | Description           |
| ---------------- | ------- | -------- | ---------------------- | --------------------- |
| `id`             | TEXT    | ✅       | -                      | Unique log identifier |
| `listing_id`     | TEXT    | ✅       | -                      | Viewed listing ID     |
| `viewer_ip`      | TEXT    | ✅       | -                      | Viewer's IP address   |
| `viewer_session` | TEXT    | ✅       | -                      | Viewer's session ID   |
| `viewed_at`      | INTEGER | ✅       | `strftime('%s','now')` | View timestamp        |

**Constraints:**

- Foreign key: `listing_id` references `listings(id)`

---

## System Tables

### 9. **d1_migrations** - Migration History

**Purpose:** Tracks applied database migrations

### 10. **sqlite_sequence** - Auto-increment Sequences

**Purpose:** SQLite internal table for auto-increment values

### 11. **\_cf_METADATA** - Cloudflare Metadata

**Purpose:** Cloudflare D1 internal metadata

---

## Indexes

### Performance Indexes

- `idx_listings_created_at` - Listings by creation date
- `idx_listings_posted_by` - Listings by user
- `idx_listings_category` - Listings by category
- `idx_listings_ad_type` - Listings by ad type
- `idx_listings_price` - Listings by price
- `idx_listings_status` - Listings by status
- `idx_listings_location` - Listings by coordinates
- `idx_users_username` - Users by username
- `idx_users_email` - Users by email
- `idx_users_verified` - Users by verification status
- `idx_users_rating` - Users by rating
- `idx_users_last_active` - Users by activity
- `idx_chats_listing_id` - Chats by listing
- `idx_chats_buyer_id` - Chats by buyer
- `idx_chats_seller_id` - Chats by seller
- `idx_chats_last_message` - Chats by last message
- `idx_messages_chat_id` - Messages by chat
- `idx_messages_from_id` - Messages by sender
- `idx_messages_created_at` - Messages by timestamp
- `idx_saved_searches_user_id` - Searches by user
- `idx_saved_searches_location` - Searches by location

---

## Foreign Key Relationships

```
users (id) ←→ listings (posted_by)
users (id) ←→ chats (buyer_id)
users (id) ←→ chats (seller_id)
users (id) ←→ messages (from_id)
users (id) ←→ saved_searches (user_id)

listings (id) ←→ chats (listing_id)
listings (id) ←→ listing_images (listing_id)
listings (id) ←→ view_logs (listing_id)

chats (id) ←→ messages (chat_id)
```

---

## Data Types

- **TEXT**: Variable-length strings
- **INTEGER**: Whole numbers (including booleans 0/1)
- **REAL**: Floating-point numbers
- **BOOLEAN**: Boolean values (stored as INTEGER 0/1)

---

## Constraints

- **Primary Keys**: Each table has a unique primary key
- **Foreign Keys**: Referential integrity maintained
- **Check Constraints**: Data validation rules
- **Unique Constraints**: Prevents duplicate values
- **Not Null**: Required fields

---

## Notes

1. **ID System**: Users have 8-character alphanumeric IDs, other entities use various ID formats
2. **Timestamps**: All timestamps stored as Unix timestamps (seconds since epoch)
3. **Coordinates**: Latitude/longitude stored as REAL values
4. **Status Fields**: Use predefined enum values for consistency
5. **Soft Deletes**: Some tables support soft deletion via status fields
6. **Audit Trail**: Creation and update timestamps maintained where applicable

---

**Last Updated:** $(date)
**Database:** bitsbarter-staging
**Status:** ✅ SCHEMA DOCUMENTED
