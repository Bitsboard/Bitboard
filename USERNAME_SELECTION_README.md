# Username Selection System

This document describes the implementation of the username selection system for new users in Bitsbarter.

## Overview

The username selection system ensures that all new users choose a username before they can access the application. This creates a consistent user experience and prevents issues with anonymous or incomplete user accounts.

## Features

- **Unclosable Modal**: Users cannot dismiss the username selection modal until they choose a valid username
- **Real-time Validation**: Username availability is checked in real-time as the user types
- **Profanity Filter**: Built-in filter prevents inappropriate usernames
- **Format Validation**: Enforces username format rules (3-12 characters, A-Z, 0-9, hyphens, underscores)
- **Database Integration**: Seamlessly integrates with the existing user management system

## Username Requirements

- **Length**: 3-12 characters
- **Characters**: Only letters (A-Z), numbers (0-9), hyphens (-), and underscores (\_)
- **Content**: No profanity or inappropriate content
- **Reserved**: Cannot use system-reserved words (admin, support, etc.)
- **Uniqueness**: Must be unique across all users

## Implementation Details

### Database Schema

The system adds a new field to the users table:

```sql
ALTER TABLE users ADD COLUMN has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1));
```

### Components

1. **UsernameSelectionModal**: The main modal component that forces username selection
2. **useUsernameSelection**: Custom hook that manages username selection state
3. **Validation Utilities**: Functions for username format and content validation

### API Endpoints

1. **POST /api/users/check-username**: Check if a username is available
2. **POST /api/users/set-username**: Set the user's chosen username
3. **GET /api/users/me**: Get current user information including username status

### User Flow

1. User signs up/logs in
2. System checks if user has chosen a username
3. If not, UsernameSelectionModal is displayed (unclosable)
4. User enters desired username
5. System validates format and checks availability
6. User confirms username selection
7. Modal closes and user can access the application
8. Username is permanently set and cannot be changed easily

## Security Features

- **Profanity Filter**: Comprehensive list of banned words and phrases
- **Input Sanitization**: All usernames are converted to lowercase and trimmed
- **Session Validation**: Username changes require valid authentication
- **Rate Limiting**: Built-in protection against abuse

## Configuration

### Profanity List

The profanity filter uses a master list defined in `src/lib/utils.ts`. This list can be updated as needed:

```typescript
const PROFANITY_LIST = [
  "fuck",
  "shit",
  "bitch",
  "ass",
  "dick",
  "cock",
  "pussy",
  "cunt",
  // ... more words
];
```

### Reserved Words

System-reserved usernames that cannot be used:

```typescript
const reservedWords = [
  "admin",
  "administrator",
  "mod",
  "moderator",
  "support",
  "help",
  "info",
  "contact",
  "about",
  "terms",
  "privacy",
];
```

## Migration

To deploy this system:

1. Run the database migration: `d1/migrations/0003_add_has_chosen_username.sql`
2. Deploy the updated code
3. Existing users will automatically be marked as having chosen usernames

## Testing

The system includes comprehensive validation:

- Format validation (length, characters)
- Content validation (profanity filter)
- Availability checking (database uniqueness)
- Error handling (network, validation, database errors)

## Future Enhancements

Potential improvements to consider:

- Username change functionality (with cooldown period)
- Username suggestions for taken usernames
- Additional content filters (e.g., trademark violations)
- Username history tracking
- Bulk username validation for admin use

## Troubleshooting

### Common Issues

1. **Modal not appearing**: Check user authentication and database connection
2. **Username validation errors**: Verify username meets all requirements
3. **Database errors**: Ensure migration has been applied
4. **Performance issues**: Check database indexes on username fields

### Debug Mode

Enable debug logging by checking browser console for detailed error messages and validation results.
