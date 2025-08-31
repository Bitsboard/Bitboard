# Database Fields Breakdown

## 1. **users** Table - User Accounts

### Primary Key

- **`id`** - Unique 8-character alphanumeric user identifier

### User Information

- **`email`** - User's email address (must be unique across all users)
- **`username`** - User's chosen display name (must be unique across all users)
- **`sso`** - Single Sign-On provider (Google, Apple, or Facebook)

### Account Status

- **`verified`** - Boolean flag for account verification (0=unverified, 1=verified)
- **`is_admin`** - Boolean flag for admin privileges (0=regular user, 1=admin)
- **`banned`** - Boolean flag for account ban status (0=active, 1=banned)

### Timestamps

- **`created_at`** - Unix timestamp when account was created
- **`last_active`** - Unix timestamp of last user activity (defaults to current time)

### Profile Data

- **`image`** - URL to user's profile picture
- **`thumbs_up`** - Count of thumbs up received from other users (must be >= 0)
- **`deals`** - Count of completed transactions (must be >= 0)
- **`has_chosen_username`** - Boolean flag indicating if user has selected a username
- **`balance`** - User's balance in satoshis (BIGINT, must be >= 0)

---

## 2. **listings** Table - Marketplace Items

### Primary Key

- **`id`** - Auto-incrementing integer listing identifier

### Content

- **`title`** - Listing title (3-200 characters, required)
- **`description`** - Detailed description of the item/service (optional, defaults to empty string)
- **`category`** - Product category (defaults to 'Misc')

### Listing Type

- **`ad_type`** - Type of listing ('sell' or 'want', defaults to 'sell')

### Location

- **`location`** - Human-readable location text (optional, defaults to empty string)
- **`lat`** - Latitude coordinate (-90 to 90, defaults to 0)
- **`lng`** - Longitude coordinate (-180 to 180, defaults to 0)

### Media

- **`image_url`** - Primary image URL for the listing (optional, defaults to empty string)
- **Note:** Multiple images supported through `listing_images` table

### Pricing

- **`price_sat`** - Price in satoshis (required, must be > 0)
- **`pricing_type`** - Pricing model ('fixed', 'negotiable', or 'Make Offer', defaults to 'fixed')

### Ownership

- **`posted_by`** - User ID of the person who created the listing (required, references users.id)

### Features

- **`boosted_until`** - Timestamp when listing boost expires (optional)

### Timestamps

- **`created_at`** - Unix timestamp when listing was created (defaults to current time)
- **`updated_at`** - Unix timestamp of last update (defaults to current time)

### Status & Metrics

- **`status`** - Current listing status (defaults to 'active')
- **`views`** - Number of times listing has been viewed (defaults to 0)

---

## 3. **chats** Table - Chat Conversations

### Primary Key

- **`id`** - Unique text identifier for the chat session

### Participants

- **`listing_id`** - ID of the listing being discussed (references listings.id)
- **`buyer_id`** - User ID of the buyer (references users.id)
- **`seller_id`** - User ID of the seller (references users.id)

### Timestamps

- **`created_at`** - Unix timestamp when chat was created (defaults to current time)
- **`last_message_at`** - Unix timestamp of the most recent message (defaults to current time)

---

## 4. **messages** Table - Chat Messages

### Primary Key

- **`id`** - Unique text identifier for the message

### Content

- **`chat_id`** - ID of the chat this message belongs to (references chats.id)
- **`from_id`** - User ID of the message sender (references users.id)
- **`text`** - Message content (1-1000 characters, required)

### Timestamps

- **`created_at`** - Unix timestamp when message was sent (defaults to current time)
- **`read_at`** - Unix timestamp when message was read (optional)

---

## 5. **saved_searches** Table - User Search Preferences

### Primary Key

- **`id`** - Unique text identifier for the saved search

### Ownership

- **`user_id`** - User ID who owns this search (references users.id)

### Search Criteria

- **`name`** - User-defined name for the search (1-100 characters, required)
- **`query`** - Text search query (optional)
- **`category`** - Category filter (optional)
- **`ad_type`** - Ad type filter (optional)

### Location

- **`center_lat`** - Search center latitude (-90 to 90, required)
- **`center_lng`** - Search center longitude (-180 to 180, required)
- **`radius_km`** - Search radius in kilometers (0-1000, required)

### Preferences

- **`notify`** - Boolean flag for notifications (defaults to 1)

### Timestamps

- **`last_opened`** - Unix timestamp when search was last used (optional)
- **`created_at`** - Unix timestamp when search was saved (defaults to current time)

---

## 7. **listing_images** Table - Multiple Images per Listing

### Primary Key

- **`id`** - Unique text identifier for the image

### Association

- **`listing_id`** - ID of the listing this image belongs to (references listings.id)

### Image Data

- **`image_url`** - URL to the image file
- **`image_order`** - Display order for multiple images (defaults to 0)

### Timestamps

- **`created_at`** - Unix timestamp when image was added (defaults to current time)

---

## 8. **view_logs** Table - Listing View Analytics

### Primary Key

- **`id`** - Unique text identifier for the view log entry

### View Details

- **`listing_id`** - ID of the listing that was viewed (references listings.id)
- **`viewer_ip`** - IP address of the viewer
- **`viewer_session`** - Session identifier for the viewer

### Timestamps

- **`viewed_at`** - Unix timestamp when the view occurred (defaults to current time)

---

## System Tables

### 9. **d1_migrations**

- Tracks which database migrations have been applied
- Internal Cloudflare D1 table

### 10. **sqlite_sequence**

- SQLite internal table for auto-increment sequences
- Manages auto-increment values for INTEGER PRIMARY KEY columns

### 11. **\_cf_METADATA**

- Cloudflare D1 internal metadata table
- Stores database configuration and metadata

---

## Field Type Summary

### Data Types Used

- **TEXT**: Variable-length strings (IDs, URLs, names, descriptions)
- **INTEGER**: Whole numbers (counts, timestamps, booleans 0/1)
- **REAL**: Floating-point numbers (coordinates)
- **BOOLEAN**: Boolean values (stored as INTEGER 0/1)

### Common Patterns

- **Timestamps**: All stored as Unix timestamps (seconds since epoch)
- **IDs**: Mix of auto-increment integers and generated text identifiers
- **Coordinates**: Latitude/longitude stored as REAL values with validation
- **Status Fields**: Use predefined enum values for consistency
- **Defaults**: Most optional fields have sensible defaults

---

**Total Fields:** 79 fields across 7 main tables  
**Database:** bitsbarter-staging  
**Status:** ✅ FIELD BREAKDOWN COMPLETE - SCHEMA UPDATED
