# API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Bitsbarter application.

## Base URL

- **Staging**: `https://staging.bitsbarter.com/api`
- **Production**: `https://bitsbarter.com/api`

## Authentication

Most endpoints require authentication via JWT tokens. Include the session cookie in your requests.

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes
- **Admin endpoints**: 30 requests per minute
- **General API**: 100 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when the rate limit resets

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limited
- `500`: Internal Server Error

## Endpoints

### Authentication

#### `GET /api/auth/login`
Initiates OAuth login flow.

**Query Parameters:**
- `redirect` (optional): URL to redirect after login
- `popup` (optional): Set to "true" for popup flow

**Response:**
Redirects to OAuth provider.

#### `GET /api/auth/callback`
Handles OAuth callback.

**Query Parameters:**
- `code`: Authorization code from OAuth provider
- `state`: State parameter for security

**Response:**
Redirects to success page or specified redirect URL.

#### `POST /api/auth/logout`
Logs out the current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `GET /api/auth/session`
Gets current session information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "verified": true,
    "isAdmin": false
  }
}
```

### Listings

#### `GET /api/listings`
Gets paginated listings.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `type` (optional): Filter by type (goods/services)
- `search` (optional): Search query
- `lat` (optional): Latitude for location-based search
- `lng` (optional): Longitude for location-based search
- `radius` (optional): Search radius in km

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

#### `POST /api/listings`
Creates a new listing.

**Request Body:**
```json
{
  "title": "Listing title",
  "description": "Listing description",
  "price_sat": 100000,
  "pricing_type": "fixed",
  "category": "electronics",
  "type": "goods",
  "lat": 43.6532,
  "lng": -79.3832,
  "location": "Toronto, ON",
  "image_url": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing_id",
    "title": "Listing title",
    "created_at": 1640995200
  }
}
```

#### `GET /api/listings/[id]`
Gets a specific listing.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "listing_id",
    "title": "Listing title",
    "description": "Listing description",
    "price_sat": 100000,
    "pricing_type": "fixed",
    "category": "electronics",
    "type": "goods",
    "lat": 43.6532,
    "lng": -79.3832,
    "location": "Toronto, ON",
    "image_url": "https://example.com/image.jpg",
    "posted_by": "user_id",
    "created_at": 1640995200,
    "status": "active"
  }
}
```

#### `POST /api/listings/[id]/view`
Records a listing view.

**Response:**
```json
{
  "success": true,
  "message": "View recorded"
}
```

### Chat

#### `GET /api/chat/list`
Gets user's chat conversations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat_id",
      "listing_id": "listing_id",
      "listing_title": "Listing title",
      "other_user": {
        "id": "user_id",
        "username": "username",
        "image": "avatar_url"
      },
      "last_message": {
        "content": "Last message",
        "created_at": 1640995200
      },
      "created_at": 1640995200
    }
  ]
}
```

#### `POST /api/chat/send`
Sends a message.

**Request Body:**
```json
{
  "chat_id": "chat_id",
  "content": "Message content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "message_id",
    "content": "Message content",
    "created_at": 1640995200
  }
}
```

#### `GET /api/chat/[chatId]`
Gets chat messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "chat": {
      "id": "chat_id",
      "listing_id": "listing_id",
      "listing_title": "Listing title",
      "other_user": {
        "id": "user_id",
        "username": "username",
        "image": "avatar_url"
      }
    },
    "messages": [
      {
        "id": "message_id",
        "content": "Message content",
        "created_at": 1640995200,
        "sender_id": "user_id"
      }
    ]
  }
}
```

### Offers

#### `POST /api/offers/send`
Sends an offer.

**Request Body:**
```json
{
  "listing_id": "listing_id",
  "amount_sat": 100000,
  "expires_at": 1640995200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "offer_id",
    "amount_sat": 100000,
    "expires_at": 1640995200,
    "status": "pending"
  }
}
```

#### `POST /api/offers/action`
Accepts, declines, or revokes an offer.

**Request Body:**
```json
{
  "offer_id": "offer_id",
  "action": "accept" // or "decline" or "revoke"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer accepted"
}
```

### Admin

#### `GET /api/admin/check`
Checks admin authentication status.

**Response:**
```json
{
  "success": true,
  "isAdmin": true
}
```

#### `POST /api/admin/check`
Authenticates admin user.

**Request Body:**
```json
{
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "isAdmin": true
}
```

#### `GET /api/admin/stats`
Gets admin statistics.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `filter` (optional): Filter type

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "users": 100,
      "listings": 50,
      "chats": 25,
      "offers": 10
    },
    "recentActivity": [...]
  }
}
```

#### `GET /api/admin/analytics`
Gets analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 100,
      "activeUsers7d": 25,
      "totalListings": 50,
      "newListings7d": 5
    },
    "userGrowth": [...],
    "listingGrowth": [...]
  }
}
```

### Users

#### `GET /api/users/me`
Gets current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "verified": true,
    "thumbs_up": 5,
    "deals": 2,
    "created_at": 1640995200
  }
}
```

#### `POST /api/users/set-username`
Sets user username.

**Request Body:**
```json
{
  "username": "new_username"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Username updated"
}
```

#### `GET /api/users/[username]`
Gets user profile by username.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "username",
    "thumbs_up": 5,
    "deals": 2,
    "created_at": 1640995200
  }
}
```

### Bitcoin Rate

#### `GET /api/btc-rate`
Gets current Bitcoin exchange rate.

**Response:**
```json
{
  "success": true,
  "data": {
    "cad": 50000.00,
    "usd": 40000.00,
    "last_updated": 1640995200
  }
}
```

### Health Check

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1640995200
}
```

## Webhooks

### Escrow Events

The application supports Lightning Network escrow events via webhooks.

#### Escrow Created
Triggered when a new escrow is created.

**Payload:**
```json
{
  "event": "escrow.created",
  "data": {
    "escrow_id": "escrow_id",
    "amount_sat": 100000,
    "buyer_id": "user_id",
    "seller_id": "user_id",
    "listing_id": "listing_id"
  }
}
```

#### Escrow Released
Triggered when escrow is released.

**Payload:**
```json
{
  "event": "escrow.released",
  "data": {
    "escrow_id": "escrow_id",
    "amount_sat": 100000,
    "buyer_id": "user_id",
    "seller_id": "user_id"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class BitsbarterAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'https://staging.bitsbarter.com/api') {
    this.baseUrl = baseUrl;
  }
  
  async getListings(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });
    
    const response = await fetch(`${this.baseUrl}/listings?${searchParams}`);
    return response.json();
  }
  
  async createListing(listing: {
    title: string;
    description: string;
    price_sat: number;
    category: string;
    type: 'goods' | 'services';
    lat: number;
    lng: number;
    location: string;
    image_url?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listing),
    });
    
    return response.json();
  }
}

// Usage
const api = new BitsbarterAPI();
const listings = await api.getListings({ page: 1, limit: 20 });
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class BitsbarterAPI:
    def __init__(self, base_url: str = "https://staging.bitsbarter.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def get_listings(self, page: int = 1, limit: int = 20, 
                    category: Optional[str] = None, 
                    search: Optional[str] = None) -> Dict[str, Any]:
        params = {"page": page, "limit": limit}
        if category:
            params["category"] = category
        if search:
            params["search"] = search
        
        response = self.session.get(f"{self.base_url}/listings", params=params)
        return response.json()
    
    def create_listing(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.base_url}/listings",
            json=listing_data
        )
        return response.json()

# Usage
api = BitsbarterAPI()
listings = api.get_listings(page=1, limit=20)
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Admin endpoints**: 30 requests per minute per IP
- **General API endpoints**: 100 requests per minute per IP

When rate limited, you'll receive a `429 Too Many Requests` response with headers indicating when you can retry:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `RATE_LIMITED` | Rate limit exceeded |
| `SERVER_ERROR` | Internal server error |

## Changelog

### v1.0.0
- Initial API release
- Authentication endpoints
- Listings CRUD operations
- Chat system
- Offers system
- Admin dashboard
- Analytics endpoints
