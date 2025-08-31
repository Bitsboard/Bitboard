import { APP_CONFIG } from '@/lib/config';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Base validation function type
type Validator<T> = (value: T, fieldName: string) => ValidationError | null;

// Common validation rules
export const validators = {
  // Required field validation
  required: <T>(value: T, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      };
    }
    return null;
  },

  // String length validation
  minLength: (minLength: number): Validator<string> => {
    return (value: string, fieldName: string): ValidationError | null => {
      if (value && value.length < minLength) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${minLength} characters long`,
          code: 'MIN_LENGTH'
        };
      }
      return null;
    };
  },

  maxLength: (maxLength: number): Validator<string> => {
    return (value: string, fieldName: string): ValidationError | null => {
      if (value && value.length > maxLength) {
        return {
          field: fieldName,
          message: `${fieldName} must be no more than ${maxLength} characters long`,
          code: 'MAX_LENGTH'
        };
      }
      return null;
    };
  },

  // Email validation
  email: (value: string, fieldName: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        code: 'INVALID_EMAIL'
      };
    }
    return null;
  },

  // Username validation
  username: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    
    // Username rules: alphanumeric, underscore, hyphen, 3-30 characters
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be 3-30 characters long and contain only letters, numbers, underscores, and hyphens`,
        code: 'INVALID_USERNAME'
      };
    }
    
    // Check for reserved usernames
    const reservedUsernames = ['admin', 'root', 'system', 'support', 'help', 'info'];
    if (reservedUsernames.includes(value.toLowerCase())) {
      return {
        field: fieldName,
        message: `${fieldName} is reserved and cannot be used`,
        code: 'RESERVED_USERNAME'
      };
    }
    
    return null;
  },

  // Password validation
  password: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    
    const minLength = APP_CONFIG.MIN_PASSWORD_LENGTH;
    if (value.length < minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters long`,
        code: 'PASSWORD_TOO_SHORT'
      };
    }
    
    // Check for common password patterns
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return {
        field: fieldName,
        message: `${fieldName} must contain at least one uppercase letter, one lowercase letter, and one number`,
        code: 'PASSWORD_TOO_WEAK'
      };
    }
    
    return null;
  },

  // Price validation
  price: (value: number, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined) return null;
    
    // Allow -1 for "make offer" listings
    if (value === -1) {
      return null;
    }
    
    if (value < APP_CONFIG.MIN_PRICE_SATS) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${APP_CONFIG.MIN_PRICE_SATS} sats`,
        code: 'PRICE_TOO_LOW'
      };
    }
    
    if (value > APP_CONFIG.MAX_PRICE_SATS) {
      return {
        field: fieldName,
        message: `${fieldName} must be no more than ${APP_CONFIG.MAX_PRICE_SATS} sats`,
        code: 'PRICE_TOO_HIGH'
      };
    }
    
    return null;
  },

  // URL validation
  url: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    
    try {
      new URL(value);
      return null;
    } catch {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid URL`,
        code: 'INVALID_URL'
      };
    }
  },

  // Phone number validation (basic)
  phone: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid phone number`,
        code: 'INVALID_PHONE'
      };
    }
    
    return null;
  },

  // File validation
  file: (file: File | null, fieldName: string, options?: {
    maxSize?: number;
    allowedTypes?: (string | 'image/jpeg' | 'image/png' | 'image/webp')[];
  }): ValidationError | null => {
    if (!file) return null;
    
    const maxSize = options?.maxSize || APP_CONFIG.MAX_IMAGE_SIZE;
    const allowedTypes = options?.allowedTypes || APP_CONFIG.ALLOWED_IMAGE_TYPES;
    
    if (file.size > maxSize) {
      return {
        field: fieldName,
        message: `${fieldName} must be smaller than ${Math.round(maxSize / (1024 * 1024))}MB`,
        code: 'FILE_TOO_LARGE'
      };
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.some(type => type === file.type)) {
      return {
        field: fieldName,
        message: `${fieldName} must be one of: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      };
    }
    
    return null;
  },

  // Custom validation function
  custom: <T>(validator: (value: T) => boolean, message: string, code: string): Validator<T> => {
    return (value: T, fieldName: string): ValidationError | null => {
      if (!validator(value)) {
        return {
          field: fieldName,
          message: message,
          code: code
        };
      }
      return null;
    };
  }
};

// Form validation function
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Validator<any>[]>
): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const [field, fieldValidators] of Object.entries(rules)) {
    const value = data[field];
    
    for (const validator of fieldValidators) {
      const error = validator(value, field);
      if (error) {
        errors.push(error);
        break; // Stop validating this field after first error
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Field-specific validation
export function validateField<T>(
  value: T,
  fieldName: string,
  validators: Validator<T>[]
): ValidationError | null {
  for (const validator of validators) {
    const error = validator(value, fieldName);
    if (error) {
      return error;
    }
  }
  return null;
}

// Common validation schemas
export const validationSchemas = {
  user: {
    email: [validators.required, validators.email],
    username: [validators.required, validators.username],
    password: [validators.required, validators.password],
  },
  
  listing: {
    title: [
      validators.required,
      validators.minLength(3),
      validators.maxLength(APP_CONFIG.MAX_TITLE_LENGTH)
    ],
    description: [
      validators.required,
      validators.minLength(10),
      validators.maxLength(APP_CONFIG.MAX_DESCRIPTION_LENGTH)
    ],
    priceSat: [validators.required, validators.price],
    category: [validators.required],
    location: [validators.required],
  },
  
  profile: {
    username: [validators.required, validators.username],
    email: [validators.required, validators.email],
    phone: [validators.phone], // Optional
  }
};

export default validators;
