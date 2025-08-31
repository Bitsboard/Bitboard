// Naming Conventions Guide for bitsbarter project

// 1. File and Directory Naming
// - Use kebab-case for file and directory names
// - Examples: user-profile.tsx, api-endpoints.ts, database-migrations/

// 2. Component Naming
// - Use PascalCase for React components
// - Examples: UserProfile, ApiEndpoints, DatabaseMigrations
// - Suffix with type: UserProfile.tsx, UserProfile.test.tsx

// 3. Function and Variable Naming
// - Use camelCase for functions and variables
// - Examples: getUserProfile, apiEndpoints, databaseMigrations
// - Boolean variables should start with is/has/can: isLoading, hasData, canEdit

// 4. Constants and Configuration
// - Use UPPER_SNAKE_CASE for constants
// - Examples: MAX_RETRY_ATTEMPTS, DEFAULT_TIMEOUT, API_BASE_URL

// 5. Type and Interface Naming
// - Use PascalCase for types and interfaces
// - Examples: UserProfile, ApiResponse, ValidationError
// - Suffix with type: UserProfileProps, ApiResponseData

// 6. Database and API Naming
// - Use snake_case for database columns and API fields
// - Examples: user_id, created_at, is_verified
// - Transform to camelCase in frontend: userId, createdAt, isVerified

// 7. CSS Class Naming
// - Use kebab-case for CSS classes
// - Examples: user-profile, api-endpoints, database-migrations
// - Use BEM methodology when appropriate: user-profile__header, user-profile--active

// 8. Import/Export Naming
// - Use named exports for components and utilities
// - Use default exports only for main page components
// - Examples: export { UserProfile }, export default function HomePage()

// 9. Error Handling
// - Use descriptive error names: ValidationError, NetworkError, AuthenticationError
// - Use consistent error codes: VALIDATION_FAILED, NETWORK_TIMEOUT, AUTH_REQUIRED

// 10. Event Handler Naming
// - Use handle prefix for event handlers: handleClick, handleSubmit, handleChange
// - Use on prefix for props: onClick, onSubmit, onChange

// 11. Async Function Naming
// - Use descriptive names that indicate async nature: fetchUserData, saveUserProfile
// - Avoid generic names like: get, post, update

// 12. State Variable Naming
// - Use descriptive names: userProfile, isLoading, errorMessage
// - Avoid abbreviations: user instead of usr, message instead of msg

// 13. Configuration Object Naming
// - Use descriptive names: APP_CONFIG, DATABASE_CONFIG, API_CONFIG
// - Group related settings together

// 14. Utility Function Naming
// - Use verb-noun format: formatDate, validateEmail, parseResponse
// - Be specific about what the function does

// 15. Test File Naming
// - Use .test.ts or .spec.ts suffix
// - Match the file being tested: UserProfile.test.tsx for UserProfile.tsx

export const NAMING_CONVENTIONS = {
  FILE_NAMING: 'kebab-case',
  COMPONENT_NAMING: 'PascalCase',
  FUNCTION_NAMING: 'camelCase',
  CONSTANT_NAMING: 'UPPER_SNAKE_CASE',
  TYPE_NAMING: 'PascalCase',
  DATABASE_NAMING: 'snake_case',
  CSS_CLASS_NAMING: 'kebab-case',
  ERROR_NAMING: 'PascalCase',
  EVENT_HANDLER_PREFIX: 'handle',
  EVENT_PROP_PREFIX: 'on',
  BOOLEAN_PREFIXES: ['is', 'has', 'can', 'should', 'will'],
  ASYNC_FUNCTION_SUFFIXES: ['Async', 'Promise', 'Future'],
  TEST_FILE_SUFFIXES: ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']
} as const;

// Utility function to check naming conventions
export function validateNaming(name: string, convention: keyof typeof NAMING_CONVENTIONS): boolean {
  const patterns = {
    'kebab-case': /^[a-z]+(-[a-z]+)*$/,
    'PascalCase': /^[A-Z][a-zA-Z]*$/,
    'camelCase': /^[a-z][a-zA-Z]*$/,
    'UPPER_SNAKE_CASE': /^[A-Z]+(_[A-Z]+)*$/,
    'snake_case': /^[a-z]+(_[a-z]+)*$/
  };

  const pattern = patterns[convention];
  return pattern ? pattern.test(name) : false;
}

export default NAMING_CONVENTIONS;
