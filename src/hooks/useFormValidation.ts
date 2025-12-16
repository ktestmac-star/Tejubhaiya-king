import { useState, useCallback, useMemo } from 'react';
import { 
  ValidationUtils, 
  FormValidationRules, 
  ValidationError 
} from '../utils/ValidationUtils';
import { 
  ErrorHandlingUtils, 
  AppError, 
  ErrorType 
} from '../utils/ErrorHandlingUtils';

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  valid: boolean;
}

export interface FormState {
  [fieldName: string]: FormField;
}

export interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsOnlyAfterSubmit?: boolean;
}

export interface UseFormValidationReturn {
  formState: FormState;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  hasBeenSubmitted: boolean;
  setValue: (fieldName: string, value: any) => void;
  setFieldTouched: (fieldName: string, touched?: boolean) => void;
  validateField: (fieldName: string) => boolean;
  validateForm: () => boolean;
  clearErrors: () => void;
  clearField: (fieldName: string) => void;
  resetForm: () => void;
  setSubmitting: (submitting: boolean) => void;
  getFieldError: (fieldName: string) => string | undefined;
  getFieldProps: (fieldName: string) => {
    value: any;
    onChangeText: (value: string) => void;
    onBlur: () => void;
    error: string | undefined;
  };
  submitForm: (onSubmit: (values: Record<string, any>) => Promise<void>) => Promise<void>;
}

export const useFormValidation = (
  initialValues: Record<string, any>,
  validationRules: FormValidationRules,
  options: UseFormValidationOptions = {}
): UseFormValidationReturn => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showErrorsOnlyAfterSubmit = false
  } = options;

  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    for (const [fieldName, value] of Object.entries(initialValues)) {
      state[fieldName] = {
        value,
        touched: false,
        valid: true,
        error: undefined
      };
    }
    return state;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);

  // Get current form values
  const formValues = useMemo(() => {
    const values: Record<string, any> = {};
    for (const [fieldName, field] of Object.entries(formState)) {
      values[fieldName] = field.value;
    }
    return values;
  }, [formState]);

  // Get current validation errors
  const errors = useMemo(() => {
    const validationErrors: ValidationError[] = [];
    for (const [fieldName, field] of Object.entries(formState)) {
      if (field.error && (field.touched || hasBeenSubmitted)) {
        validationErrors.push({
          field: fieldName,
          message: field.error,
          code: 'VALIDATION_ERROR'
        });
      }
    }
    return validationErrors;
  }, [formState, hasBeenSubmitted]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.values(formState).every(field => field.valid);
  }, [formState]);

  // Set field value and optionally validate
  const setValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => {
      const newState = { ...prev };
      
      if (!newState[fieldName]) {
        newState[fieldName] = {
          value,
          touched: false,
          valid: true,
          error: undefined
        };
      } else {
        newState[fieldName] = {
          ...newState[fieldName],
          value
        };
      }

      // Validate on change if enabled
      if (validateOnChange && validationRules[fieldName]) {
        const validationError = ValidationUtils.validateField(
          fieldName,
          value,
          validationRules[fieldName]
        );
        
        newState[fieldName].valid = !validationError;
        newState[fieldName].error = validationError?.message;
      }

      return newState;
    });
  }, [validateOnChange, validationRules]);

  // Set field as touched
  const setFieldTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched
      }
    }));
  }, []);

  // Validate a specific field
  const validateField = useCallback((fieldName: string): boolean => {
    if (!validationRules[fieldName]) return true;

    const fieldValue = formState[fieldName]?.value;
    const validationError = ValidationUtils.validateField(
      fieldName,
      fieldValue,
      validationRules[fieldName]
    );

    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        valid: !validationError,
        error: validationError?.message,
        touched: true
      }
    }));

    return !validationError;
  }, [formState, validationRules]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const validationResult = ValidationUtils.validateForm(formValues, validationRules);
    
    setFormState(prev => {
      const newState = { ...prev };
      
      // Clear all errors first
      for (const fieldName of Object.keys(newState)) {
        newState[fieldName] = {
          ...newState[fieldName],
          valid: true,
          error: undefined,
          touched: true
        };
      }
      
      // Set validation errors from the errors array
      if (validationResult.errors && validationResult.errors.length > 0) {
        // For now, just mark the first field as invalid
        // In a more sophisticated implementation, you'd parse the error messages
        // to determine which field each error belongs to
        const firstFieldName = Object.keys(newState)[0];
        if (firstFieldName && newState[firstFieldName]) {
          newState[firstFieldName].valid = false;
          newState[firstFieldName].error = validationResult.errors[0];
        }
      }
      
      return newState;
    });

    return validationResult.isValid;
  }, [formValues, validationRules]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setFormState(prev => {
      const newState = { ...prev };
      for (const fieldName of Object.keys(newState)) {
        newState[fieldName] = {
          ...newState[fieldName],
          valid: true,
          error: undefined
        };
      }
      return newState;
    });
  }, []);

  // Clear specific field
  const clearField = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: initialValues[fieldName] || '',
        valid: true,
        error: undefined,
        touched: false
      }
    }));
  }, [initialValues]);

  // Reset entire form
  const resetForm = useCallback(() => {
    setFormState(() => {
      const state: FormState = {};
      for (const [fieldName, value] of Object.entries(initialValues)) {
        state[fieldName] = {
          value,
          touched: false,
          valid: true,
          error: undefined
        };
      }
      return state;
    });
    setHasBeenSubmitted(false);
    setIsSubmitting(false);
  }, [initialValues]);

  // Set submitting state
  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Get field error (respects showErrorsOnlyAfterSubmit option)
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const field = formState[fieldName];
    if (!field) return undefined;
    
    if (showErrorsOnlyAfterSubmit && !hasBeenSubmitted) {
      return undefined;
    }
    
    return field.touched ? field.error : undefined;
  }, [formState, showErrorsOnlyAfterSubmit, hasBeenSubmitted]);

  // Get field props for easy integration with TextInput
  const getFieldProps = useCallback((fieldName: string) => {
    return {
      value: formState[fieldName]?.value || '',
      onChangeText: (value: string) => setValue(fieldName, value),
      onBlur: () => {
        setFieldTouched(fieldName, true);
        if (validateOnBlur) {
          validateField(fieldName);
        }
      },
      error: getFieldError(fieldName)
    };
  }, [formState, setValue, setFieldTouched, validateOnBlur, validateField, getFieldError]);

  // Submit form with validation and error handling
  const submitForm = useCallback(async (
    onSubmit: (values: Record<string, any>) => Promise<void>
  ): Promise<void> => {
    setHasBeenSubmitted(true);
    setIsSubmitting(true);

    try {
      // Validate form before submission
      const isFormValid = validateForm();
      
      if (!isFormValid) {
        const validationError = ErrorHandlingUtils.createValidationError(
          errors.length > 0 ? errors : [{ 
            field: 'form', 
            message: 'Please correct the errors below', 
            code: 'FORM_INVALID' 
          }],
          'form submission'
        );
        throw validationError;
      }

      // Submit form
      await onSubmit(formValues);
      
    } catch (error) {
      // Re-throw error for handling by the component
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, errors, formValues]);

  return {
    formState,
    errors,
    isValid,
    isSubmitting,
    hasBeenSubmitted,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    clearErrors,
    clearField,
    resetForm,
    setSubmitting,
    getFieldError,
    getFieldProps,
    submitForm
  };
};

// Specialized hooks for common form types
export const useStockEntryValidation = (initialValues: Record<string, any>) => {
  return useFormValidation(initialValues, {
    openingReading: {
      required: true,
      min: 0,
      max: 999999,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num)) return 'Must be a valid number';
        if (num.toString().includes('.') && num.toString().split('.')[1].length > 2) {
          return 'Maximum 2 decimal places allowed';
        }
        return null;
      }
    }
  });
};

export const useCashEntryValidation = (initialValues: Record<string, any>) => {
  return useFormValidation(initialValues, {
    actualCash: {
      required: true,
      min: 0,
      max: 1000000,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num)) return 'Must be a valid number';
        if (num.toString().includes('.') && num.toString().split('.')[1].length > 2) {
          return 'Maximum 2 decimal places allowed';
        }
        return null;
      }
    },
    digitalPayments: {
      min: 0,
      max: 1000000,
      custom: (value) => {
        if (!value) return null; // Optional field
        const num = Number(value);
        if (isNaN(num)) return 'Must be a valid number';
        if (num.toString().includes('.') && num.toString().split('.')[1].length > 2) {
          return 'Maximum 2 decimal places allowed';
        }
        return null;
      }
    },
    cashUsed: {
      min: 0,
      max: 100000,
      custom: (value) => {
        if (!value) return null; // Optional field
        const num = Number(value);
        if (isNaN(num)) return 'Must be a valid number';
        return null;
      }
    },
    cashUsageReason: {
      custom: (value: any) => {
        // Note: This validation is simplified since we can't access formData here
        // In a real implementation, you'd need to restructure this validation
        if (value && value.trim().length > 0 && value.trim().length < 5) {
          return 'Reason must be at least 5 characters';
        }
        return null;
      }
    }
  });
};

export const useLoginValidation = (initialValues: Record<string, any>) => {
  return useFormValidation(initialValues, {
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
    }
  });
};