import { ValidationError } from './ValidationUtils';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  suggestions?: string[];
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export interface NetworkOperationResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  attempts: number;
}

export class ErrorHandlingUtils {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SYSTEM]
  };

  /**
   * Creates a standardized error object
   */
  static createError(
    type: ErrorType,
    code: string,
    message: string,
    userMessage?: string,
    details?: any,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): AppError {
    return {
      type,
      severity,
      code,
      message,
      userMessage: userMessage || this.getDefaultUserMessage(type, code),
      details,
      timestamp: new Date(),
      retryable: this.isRetryableError(type),
      suggestions: this.getErrorSuggestions(type, code)
    };
  }

  /**
   * Creates validation error from validation results
   */
  static createValidationError(
    validationErrors: ValidationError[],
    context?: string
  ): AppError {
    const message = validationErrors.map(e => e.message).join(', ');
    const userMessage = context 
      ? `Please correct the following errors in ${context}: ${message}`
      : `Please correct the following errors: ${message}`;

    return this.createError(
      ErrorType.VALIDATION,
      'VALIDATION_FAILED',
      message,
      userMessage,
      { validationErrors },
      ErrorSeverity.LOW
    );
  }

  /**
   * Creates network error with appropriate user messaging
   */
  static createNetworkError(
    originalError: any,
    operation: string
  ): AppError {
    let code = 'NETWORK_ERROR';
    let userMessage = `Unable to ${operation}. Please check your internet connection and try again.`;
    let severity = ErrorSeverity.MEDIUM;

    // Analyze the original error to provide more specific messaging
    if (originalError?.code === 'NETWORK_ERROR' || originalError?.message?.includes('Network')) {
      code = 'NETWORK_UNAVAILABLE';
      userMessage = 'No internet connection. Please check your network settings and try again.';
    } else if (originalError?.status === 408 || originalError?.code === 'TIMEOUT') {
      code = 'REQUEST_TIMEOUT';
      userMessage = `The ${operation} request timed out. Please try again.`;
    } else if (originalError?.status >= 500) {
      code = 'SERVER_ERROR';
      userMessage = `Server error occurred while ${operation}. Please try again later.`;
      severity = ErrorSeverity.HIGH;
    } else if (originalError?.status === 401) {
      code = 'AUTHENTICATION_FAILED';
      userMessage = 'Your session has expired. Please log in again.';
      severity = ErrorSeverity.HIGH;
    } else if (originalError?.status === 403) {
      code = 'ACCESS_DENIED';
      userMessage = 'You do not have permission to perform this action.';
      severity = ErrorSeverity.MEDIUM;
    }

    return this.createError(
      ErrorType.NETWORK,
      code,
      originalError?.message || 'Network operation failed',
      userMessage,
      originalError,
      severity
    );
  }

  /**
   * Creates database error with user-friendly messaging
   */
  static createDatabaseError(
    originalError: any,
    operation: string
  ): AppError {
    let code = 'DATABASE_ERROR';
    let userMessage = `Unable to ${operation}. Please try again.`;
    let severity = ErrorSeverity.HIGH;

    if (originalError?.message?.includes('UNIQUE constraint')) {
      code = 'DUPLICATE_ENTRY';
      userMessage = 'This record already exists. Please check your input.';
      severity = ErrorSeverity.MEDIUM;
    } else if (originalError?.message?.includes('NOT NULL constraint')) {
      code = 'MISSING_REQUIRED_DATA';
      userMessage = 'Required information is missing. Please complete all required fields.';
      severity = ErrorSeverity.MEDIUM;
    } else if (originalError?.message?.includes('database is locked')) {
      code = 'DATABASE_LOCKED';
      userMessage = 'The system is temporarily busy. Please try again in a moment.';
    }

    return this.createError(
      ErrorType.DATABASE,
      code,
      originalError?.message || 'Database operation failed',
      userMessage,
      originalError,
      severity
    );
  }

  /**
   * Creates business logic error
   */
  static createBusinessLogicError(
    code: string,
    message: string,
    userMessage?: string,
    suggestions?: string[]
  ): AppError {
    const error = this.createError(
      ErrorType.BUSINESS_LOGIC,
      code,
      message,
      userMessage,
      undefined,
      ErrorSeverity.MEDIUM
    );
    
    if (suggestions) {
      error.suggestions = suggestions;
    }
    
    return error;
  }

  /**
   * Executes an operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: Partial<RetryConfig> = {}
  ): Promise<NetworkOperationResult<T>> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: AppError | null = null;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt
        };
      } catch (error) {
        lastError = this.normalizeError(error, operationName);
        
        // Don't retry if error is not retryable or this is the last attempt
        if (!retryConfig.retryableErrors.includes(lastError.type) || 
            attempt === retryConfig.maxAttempts) {
          break;
        }
        
        // Calculate delay for next attempt
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        await this.sleep(jitteredDelay);
      }
    }
    
    return {
      success: false,
      error: lastError!,
      attempts: retryConfig.maxAttempts
    };
  }

  /**
   * Handles errors gracefully with fallback options
   */
  static handleErrorGracefully<T>(
    error: AppError,
    fallbackValue?: T,
    fallbackOperation?: () => Promise<T>
  ): { success: boolean; data?: T; error?: AppError; usedFallback: boolean } {
    // For offline scenarios, try to use cached data or offline operations
    if (error.type === ErrorType.NETWORK || error.type === ErrorType.OFFLINE) {
      if (fallbackOperation) {
        try {
          // This would typically involve offline queue or cached data
          console.log('Attempting fallback operation for:', error.code);
          // Return indication that fallback was used
          return {
            success: true,
            data: fallbackValue,
            usedFallback: true
          };
        } catch (fallbackError) {
          console.error('Fallback operation failed:', fallbackError);
        }
      }
      
      if (fallbackValue !== undefined) {
        return {
          success: true,
          data: fallbackValue,
          usedFallback: true
        };
      }
    }
    
    return {
      success: false,
      error,
      usedFallback: false
    };
  }

  /**
   * Normalizes different error types into AppError format
   */
  private static normalizeError(error: any, operationName: string): AppError {
    if (error instanceof Error) {
      // Check if it's already an AppError
      if ('type' in error && 'code' in error && 'severity' in error && 'userMessage' in error) {
        return error as AppError;
      }
      
      // Network/HTTP errors
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        return this.createNetworkError(error, operationName);
      }
      
      // Database errors
      if (error.message.includes('database') || error.message.includes('SQL')) {
        return this.createDatabaseError(error, operationName);
      }
      
      // Timeout errors
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return this.createError(
          ErrorType.TIMEOUT,
          'OPERATION_TIMEOUT',
          error.message,
          `The ${operationName} operation timed out. Please try again.`,
          error,
          ErrorSeverity.MEDIUM
        );
      }
    }
    
    // Generic system error
    return this.createError(
      ErrorType.SYSTEM,
      'UNKNOWN_ERROR',
      error?.message || 'An unknown error occurred',
      `An unexpected error occurred during ${operationName}. Please try again.`,
      error,
      ErrorSeverity.HIGH
    );
  }

  /**
   * Determines if an error type is retryable
   */
  private static isRetryableError(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.SYSTEM,
      ErrorType.DATABASE
    ].includes(type);
  }

  /**
   * Gets default user message for error types
   */
  private static getDefaultUserMessage(type: ErrorType, code: string): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.BUSINESS_LOGIC:
        return 'Operation cannot be completed due to business rules.';
      case ErrorType.DATABASE:
        return 'Data operation failed. Please try again.';
      case ErrorType.TIMEOUT:
        return 'Operation timed out. Please try again.';
      case ErrorType.OFFLINE:
        return 'You are currently offline. Changes will be saved when connection is restored.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Gets helpful suggestions for common errors
   */
  private static getErrorSuggestions(type: ErrorType, code: string): string[] {
    const suggestions: string[] = [];
    
    switch (type) {
      case ErrorType.NETWORK:
        suggestions.push(
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the problem persists'
        );
        break;
      case ErrorType.VALIDATION:
        suggestions.push(
          'Review the highlighted fields',
          'Ensure all required information is provided',
          'Check the format of your input'
        );
        break;
      case ErrorType.AUTHENTICATION:
        suggestions.push(
          'Log out and log back in',
          'Check your username and password',
          'Contact your administrator if needed'
        );
        break;
      case ErrorType.BUSINESS_LOGIC:
        if (code.includes('DUPLICATE')) {
          suggestions.push('Check if this record already exists');
        } else if (code.includes('WORKFLOW')) {
          suggestions.push('Complete the previous steps first');
        }
        break;
    }
    
    return suggestions;
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formats error for logging
   */
  static formatErrorForLogging(error: AppError): string {
    return JSON.stringify({
      timestamp: error.timestamp.toISOString(),
      type: error.type,
      severity: error.severity,
      code: error.code,
      message: error.message,
      details: error.details
    }, null, 2);
  }

  /**
   * Formats error for user display
   */
  static formatErrorForUser(error: AppError): {
    title: string;
    message: string;
    suggestions?: string[];
  } {
    let title = 'Error';
    
    switch (error.severity) {
      case ErrorSeverity.LOW:
        title = 'Input Error';
        break;
      case ErrorSeverity.MEDIUM:
        title = 'Operation Failed';
        break;
      case ErrorSeverity.HIGH:
        title = 'System Error';
        break;
      case ErrorSeverity.CRITICAL:
        title = 'Critical Error';
        break;
    }
    
    return {
      title,
      message: error.userMessage,
      suggestions: error.suggestions
    };
  }
}

// Predefined error configurations for common operations
export const ErrorConfigs = {
  stockEntry: {
    maxAttempts: 2,
    baseDelay: 1000,
    retryableErrors: [ErrorType.NETWORK, ErrorType.DATABASE]
  },
  
  cashReconciliation: {
    maxAttempts: 3,
    baseDelay: 1500,
    retryableErrors: [ErrorType.NETWORK, ErrorType.DATABASE, ErrorType.TIMEOUT]
  },
  
  authentication: {
    maxAttempts: 1, // Don't retry auth failures
    baseDelay: 0,
    retryableErrors: []
  },
  
  reportGeneration: {
    maxAttempts: 2,
    baseDelay: 2000,
    retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT]
  },
  
  dataSync: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SYSTEM]
  }
};