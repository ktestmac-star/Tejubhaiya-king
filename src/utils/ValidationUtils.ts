import { ValidationResult } from '../types';

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface FormValidationRules {
  [fieldName: string]: FieldValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationUtils {
  /**
   * Validates a single field value against its rules
   */
  static validateField(
    fieldName: string,
    value: any,
    rules: FieldValidationRule
  ): ValidationError | null {
    // Required field validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} is required`,
        code: 'REQUIRED'
      };
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    const stringValue = String(value);

    // String length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} must be at least ${rules.minLength} characters`,
        code: 'MIN_LENGTH'
      };
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} must not exceed ${rules.maxLength} characters`,
        code: 'MAX_LENGTH'
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return {
        field: fieldName,
        message: this.getPatternErrorMessage(fieldName, rules.pattern),
        code: 'PATTERN'
      };
    }

    // Numeric validations
    if (rules.min !== undefined || rules.max !== undefined) {
      const numericValue = Number(value);
      
      if (isNaN(numericValue)) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be a valid number`,
          code: 'INVALID_NUMBER'
        };
      }

      if (rules.min !== undefined && numericValue < rules.min) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at least ${rules.min}`,
          code: 'MIN_VALUE'
        };
      }

      if (rules.max !== undefined && numericValue > rules.max) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must not exceed ${rules.max}`,
          code: 'MAX_VALUE'
        };
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return {
          field: fieldName,
          message: customError,
          code: 'CUSTOM'
        };
      }
    }

    return null;
  }

  /**
   * Validates an entire form object against validation rules
   */
  static validateForm(
    formData: Record<string, any>,
    rules: FormValidationRules
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const fieldValue = formData[fieldName];
      const fieldError = this.validateField(fieldName, fieldValue, fieldRules);
      
      if (fieldError) {
        errors.push(fieldError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(e => e.message)
    };
  }

  /**
   * Stock reading specific validation
   */
  static validateStockReading(
    reading: number,
    previousReading?: number,
    readingType: 'opening' | 'closing' = 'opening'
  ): ValidationResult {
    const errors: string[] = [];

    // Basic numeric validation
    if (!Number.isFinite(reading)) {
      errors.push('Stock reading must be a valid number');
    } else if (reading < 0) {
      errors.push('Stock reading cannot be negative');
    } else if (reading > 999999) {
      errors.push('Stock reading seems unusually high (max: 999,999)');
    }

    // Sequential validation
    if (previousReading !== undefined && reading < previousReading) {
      const readingTypeText = readingType === 'opening' ? 'opening' : 'closing';
      errors.push(
        `${this.formatFieldName(readingTypeText)} reading (${reading}) must be greater than or equal to previous reading (${previousReading})`
      );
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Cash amount validation
   */
  static validateCashAmount(
    amount: number,
    fieldName: string = 'amount',
    allowZero: boolean = true
  ): ValidationResult {
    const errors: string[] = [];

    if (!Number.isFinite(amount)) {
      errors.push(`${this.formatFieldName(fieldName)} must be a valid number`);
    } else if (amount < 0) {
      errors.push(`${this.formatFieldName(fieldName)} cannot be negative`);
    } else if (!allowZero && amount === 0) {
      errors.push(`${this.formatFieldName(fieldName)} must be greater than zero`);
    } else if (amount > 1000000) {
      errors.push(`${this.formatFieldName(fieldName)} seems unusually high (max: ₹10,00,000)`);
    }

    // Check for reasonable decimal places (max 2)
    if (Number.isFinite(amount) && amount.toString().includes('.')) {
      const decimalPlaces = amount.toString().split('.')[1].length;
      if (decimalPlaces > 2) {
        errors.push(`${this.formatFieldName(fieldName)} should have at most 2 decimal places`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Mobile number validation
   */
  static validateMobileNumber(mobileNumber: string): ValidationResult {
    const errors: string[] = [];
    
    if (!mobileNumber || mobileNumber.trim() === '') {
      errors.push('Mobile number is required');
    } else {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      
      if (cleanNumber.length !== 10) {
        errors.push('Mobile number must be 10 digits');
      } else if (!/^[6-9]/.test(cleanNumber)) {
        errors.push('Mobile number must start with 6, 7, 8, or 9');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Username validation
   */
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];
    
    if (!username || username.trim() === '') {
      errors.push('Username is required');
    } else {
      const trimmedUsername = username.trim();
      
      if (trimmedUsername.length < 3) {
        errors.push('Username must be at least 3 characters');
      } else if (trimmedUsername.length > 50) {
        errors.push('Username must not exceed 50 characters');
      } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
        errors.push('Username can only contain letters, numbers, dots, hyphens, and underscores');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Password validation
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
      if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Dispenser code validation
   */
  static validateDispenserCode(code: string): ValidationResult {
    const errors: string[] = [];
    
    if (!code || code.trim() === '') {
      errors.push('Dispenser code is required');
    } else {
      const trimmedCode = code.trim().toUpperCase();
      
      if (trimmedCode.length < 2) {
        errors.push('Dispenser code must be at least 2 characters');
      } else if (trimmedCode.length > 10) {
        errors.push('Dispenser code must not exceed 10 characters');
      } else if (!/^[A-Z0-9-]+$/.test(trimmedCode)) {
        errors.push('Dispenser code can only contain letters, numbers, and hyphens');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Fuel price validation
   */
  static validateFuelPrice(price: number): ValidationResult {
    const errors: string[] = [];

    if (!Number.isFinite(price)) {
      errors.push('Fuel price must be a valid number');
    } else if (price <= 0) {
      errors.push('Fuel price must be greater than zero');
    } else if (price < 50) {
      errors.push('Fuel price seems too low (minimum: ₹50)');
    } else if (price > 500) {
      errors.push('Fuel price seems too high (maximum: ₹500)');
    }

    // Check decimal places
    if (Number.isFinite(price) && price.toString().includes('.')) {
      const decimalPlaces = price.toString().split('.')[1].length;
      if (decimalPlaces > 2) {
        errors.push('Fuel price should have at most 2 decimal places');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Date range validation
   */
  static validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    const errors: string[] = [];
    
    if (!startDate || !endDate) {
      errors.push('Both start and end dates are required');
    } else {
      if (startDate > endDate) {
        errors.push('Start date must be before or equal to end date');
      }
      
      const now = new Date();
      if (startDate > now) {
        errors.push('Start date cannot be in the future');
      }
      
      // Check for reasonable date range (not more than 1 year)
      const daysDifference = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDifference > 365) {
        errors.push('Date range cannot exceed 365 days');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format field name for user-friendly error messages
   */
  private static formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  /**
   * Get user-friendly error message for pattern validation
   */
  private static getPatternErrorMessage(fieldName: string, pattern: RegExp): string {
    const formattedName = this.formatFieldName(fieldName);
    
    // Common pattern error messages
    if (pattern.source.includes('[a-zA-Z0-9]')) {
      return `${formattedName} can only contain letters and numbers`;
    }
    if (pattern.source.includes('@')) {
      return `${formattedName} must be a valid email address`;
    }
    if (pattern.source.includes('[0-9]')) {
      return `${formattedName} can only contain numbers`;
    }
    
    return `${formattedName} format is invalid`;
  }
}

// Common validation rule presets
export const ValidationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_.-]+$/
  },
  
  password: {
    required: true,
    minLength: 6,
    maxLength: 128
  },
  
  mobileNumber: {
    required: true,
    pattern: /^[6-9]\d{9}$/
  },
  
  dispenserCode: {
    required: true,
    minLength: 2,
    maxLength: 10,
    pattern: /^[A-Z0-9-]+$/
  },
  
  stockReading: {
    required: true,
    min: 0,
    max: 999999
  },
  
  cashAmount: {
    required: true,
    min: 0,
    max: 1000000
  },
  
  fuelPrice: {
    required: true,
    min: 50,
    max: 500
  },
  
  reasonText: {
    required: true,
    minLength: 5,
    maxLength: 500
  }
};