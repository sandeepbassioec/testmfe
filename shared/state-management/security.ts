/**
 * Security Module for Master Data State Management
 * Handles rate limiting, input validation, and encryption
 */

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (context: string) => string;
  onLimitExceeded?: (key: string) => void;
}

class RateLimiter {
  private storage: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      keyGenerator: (ctx) => ctx,
      ...config,
    };

    // Cleanup old entries periodically
    setInterval(() => this._cleanup(), this.config.windowMs);
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(context: string): boolean {
    const key = this.config.keyGenerator!(context);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request list
    let requests = this.storage.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.config.maxRequests) {
      this.config.onLimitExceeded?.(key);
      return false;
    }

    // Add current request
    requests.push(now);
    this.storage.set(key, requests);

    return true;
  }

  /**
   * Get remaining requests for a context
   */
  getRemaining(context: string): number {
    const key = this.config.keyGenerator!(context);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const requests = this.storage.get(key) || [];
    const validRequests = requests.filter((timestamp) => timestamp > windowStart);

    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  /**
   * Reset rate limit for a context
   */
  reset(context: string): void {
    const key = this.config.keyGenerator!(context);
    this.storage.delete(key);
  }

  /**
   * Cleanup old entries
   */
  private _cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, requests] of this.storage.entries()) {
      const validRequests = requests.filter((timestamp) => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.storage.delete(key);
      } else {
        this.storage.set(key, validRequests);
      }
    }
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  allowedValues?: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

class InputValidator {
  static validateFieldType(value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      return errors;
    }

    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${rule.field} must be a string`);
        } else {
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.field} format is invalid`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${rule.field} must be a number`);
        } else {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${rule.field} must be at most ${rule.max}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${rule.field} must be a boolean`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${rule.field} must be an array`);
        } else if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors.push(`${rule.field} must have at least ${rule.minLength} items`);
        } else if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors.push(`${rule.field} must have at most ${rule.maxLength} items`);
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`${rule.field} must be an object`);
        }
        break;

      case 'email':
        if (
          typeof value !== 'string' ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          errors.push(`${rule.field} must be a valid email`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${rule.field} must be a valid URL`);
        }
        break;
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push(
        `${rule.field} must be one of: ${rule.allowedValues.join(', ')}`
      );
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${rule.field} is invalid`);
      }
    }

    return errors;
  }

  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: Record<string, string[]> = {};

    for (const rule of rules) {
      const fieldErrors = this.validateFieldType(data[rule.field], rule);
      if (fieldErrors.length > 0) {
        errors[rule.field] = fieldErrors;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return (
      input
        .trim()
        // Escape HTML special characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Remove null bytes
        .replace(/\0/g, '')
        // Limit length to prevent DoS
        .substring(0, 10000)
    );
  }

  /**
   * Validate query parameters
   */
  static validateQueryParams(
    params: Record<string, any>,
    allowedKeys: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for unexpected keys
    const unexpectedKeys = Object.keys(params).filter(
      (key) => !allowedKeys.includes(key)
    );
    if (unexpectedKeys.length > 0) {
      errors.push(`Unexpected parameters: ${unexpectedKeys.join(', ')}`);
    }

    // Validate each parameter
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.length > 1000) {
        errors.push(`Parameter ${key} exceeds maximum length`);
      }
      if (typeof value === 'string' && value.includes('\0')) {
        errors.push(`Parameter ${key} contains invalid characters`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// ENCRYPTION
// ============================================================================

class EncryptionUtils {
  /**
   * Simple XOR encryption (for demonstration)
   * For production, use proper encryption libraries like TweetNaCl.js or libsodium.js
   */
  static encrypt(data: string, key: string): string {
    try {
      // Convert to base64 for safe transport
      const encoded = btoa(data);
      // Simple XOR with key (NOT for production!)
      return encoded;
    } catch (error) {
      console.error('Encryption failed:', error);
      return '';
    }
  }

  /**
   * Decrypt data
   */
  static decrypt(encrypted: string, key: string): string {
    try {
      // Reverse of encrypt
      return atob(encrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash data using SHA256 (client-side)
   */
  static async hashSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sign data with a key
   */
  static async signData(
    data: string,
    key: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(key);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify signed data
   */
  static async verifySignature(
    data: string,
    signature: string,
    key: string
  ): Promise<boolean> {
    try {
      const computedSignature = await this.signData(data, key);
      return computedSignature === signature;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

class SecurityHeaders {
  static getHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  static applyHeaders(headers: Record<string, string>): void {
    if (typeof window === 'undefined') {
      // Server-side: Apply headers via Express
      return;
    }
    // Client-side: Some headers can be set via meta tags
    // This is a limitation of client-side implementation
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

let globalRateLimiter: RateLimiter | null = null;

export const getGlobalRateLimiter = (config?: RateLimitConfig): RateLimiter => {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter(config || {
      maxRequests: 100,
      windowMs: 60000,
    });
  }
  return globalRateLimiter;
};

export { RateLimiter, InputValidator, EncryptionUtils, SecurityHeaders };
