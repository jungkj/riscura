/**
 * Enhanced Mobile Form System
 * Provides enterprise-grade mobile-optimized form functionality with progressive enhancement
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  X,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Camera,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Lock,
  User,
  Hash,
  Type,
  List,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import {
  useDeviceInfo,
  TouchOptimizedButton,
  MobileFormField,
  MobileOptimized,
  useA11yAnnouncement,
  useSwipeGesture,
} from '@/lib/responsive/mobile-optimization-framework';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'toggle' | 'date' | 'datetime' | 'time' | 'file' | 'image' | 'location';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  value?: any;
  defaultValue?: any;
  options?: { value: any; label: string; disabled?: boolean }[];
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
  };
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  autoComplete?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  rows?: number;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  className?: string;
  mobileOptimizations?: {
    showClearButton?: boolean;
    hapticFeedback?: boolean;
    autoFocus?: boolean;
    predictiveText?: boolean;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validation?: (values: Record<string, any>) => Record<string, string>;
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: any;
  };
}

export interface EnhancedMobileFormProps {
  sections: FormSection[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  enableProgressIndicator?: boolean;
  enableSectionNavigation?: boolean;
  enableValidationOnBlur?: boolean;
  enableHapticFeedback?: boolean;
  className?: string;
  loading?: boolean;
  error?: string;
  success?: string;
}

interface FormErrors {
  [key: string]: string;
}

interface FormTouched {
  [key: string]: boolean;
}

// ============================================================================
// FIELD COMPONENTS
// ============================================================================

function TextInputField({ field, value, onChange, onBlur, error, touched }: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const device = useDeviceInfo();
  const inputRef = useRef<HTMLInputElement>(null);

  const inputType = field.type === 'password' && showPassword ? 'text' : field.type;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={inputType}
        id={field.id}
        name={field.name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        readOnly={field.readonly}
        autoComplete={field.autoComplete}
        inputMode={field.inputMode}
        minLength={field.validation?.minLength}
        maxLength={field.validation?.maxLength}
        min={field.validation?.min}
        max={field.validation?.max}
        pattern={field.validation?.pattern?.source}
        className={cn(
          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'text-base', // Prevents zoom on iOS
          device.type === 'mobile' && 'min-h-[48px]', // Touch-friendly height
          error && touched && 'border-red-500 ring-red-200',
          field.disabled && 'bg-gray-100 cursor-not-allowed',
          field.className
        )}
        style={{
          fontSize: device.type === 'mobile' ? '16px' : '14px', // Prevents zoom on iOS
        }}
      />

      {/* Password Toggle */}
      {field.type === 'password' && (
        <TouchOptimizedButton
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </TouchOptimizedButton>
      )}

      {/* Clear Button */}
      {field.mobileOptimizations?.showClearButton && value && (
        <TouchOptimizedButton
          type="button"
          onClick={() => onChange('')}
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          aria-label="Clear input"
        >
          <X className="w-4 h-4" />
        </TouchOptimizedButton>
      )}
    </div>
  );
}

function TextareaField({ field, value, onChange, onBlur, error, touched }: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
}) {
  const device = useDeviceInfo();

  return (
    <textarea
      id={field.id}
      name={field.name}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      required={field.required}
      disabled={field.disabled}
      readOnly={field.readonly}
      rows={field.rows || (device.type === 'mobile' ? 4 : 3)}
      minLength={field.validation?.minLength}
      maxLength={field.validation?.maxLength}
      className={cn(
        'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y',
        'text-base', // Prevents zoom on iOS
        error && touched && 'border-red-500 ring-red-200',
        field.disabled && 'bg-gray-100 cursor-not-allowed',
        field.className
      )}
      style={{
        fontSize: device.type === 'mobile' ? '16px' : '14px',
      }}
    />
  );
}

function SelectField({ field, value, onChange, onBlur, error, touched }: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
}) {
  const device = useDeviceInfo();

  if (field.type === 'multiselect') {
    return (
      <div className="space-y-2">
        {field.options?.map(option => (
          <label key={option.value} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(option.value)}
              onChange={(e) => {
                const currentValues = Array.isArray(value) ? value : [];
                if (e.target.checked) {
                  onChange([...currentValues, option.value]);
                } else {
                  onChange(currentValues.filter(v => v !== option.value));
                }
              }}
              disabled={option.disabled || field.disabled}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-base text-gray-900">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <select
      id={field.id}
      name={field.name}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      required={field.required}
      disabled={field.disabled}
      className={cn(
        'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'text-base bg-white',
        device.type === 'mobile' && 'min-h-[48px]',
        error && touched && 'border-red-500 ring-red-200',
        field.disabled && 'bg-gray-100 cursor-not-allowed',
        field.className
      )}
    >
      <option value="">{field.placeholder || `Select ${field.label}`}</option>
      {field.options?.map(option => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

function CheckboxField({ field, value, onChange, onBlur }: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
}) {
  return (
    <label className="flex items-start space-x-3 cursor-pointer">
      <input
        type="checkbox"
        id={field.id}
        name={field.name}
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        required={field.required}
        disabled={field.disabled}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
      />
      <div>
        <span className="text-base text-gray-900">{field.label}</span>
        {field.description && (
          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
        )}
      </div>
    </label>
  );
}

function ToggleField({ field, value, onChange, onBlur }: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
}) {
  const device = useDeviceInfo();

  return (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor={field.id} className="text-base font-medium text-gray-900">
          {field.label}
        </label>
        {field.description && (
          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
        )}
      </div>
      <TouchOptimizedButton
        type="button"
        onClick={() => {
          onChange(!value);
          onBlur();
          // Haptic feedback
          if (device.isTouch && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
        }}
        variant="ghost"
        size="sm"
        className="p-1"
        aria-label={`Toggle ${field.label}`}
        aria-pressed={!!value}
      >
        {value ? (
          <ToggleRight className="w-8 h-8 text-blue-600" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-400" />
        )}
      </TouchOptimizedButton>
    </div>
  );
}

function FileField({ field, value, onChange, onBlur, error, touched }: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
}) {
  const device = useDeviceInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate file size
    if (field.maxFileSize) {
      const oversizedFiles = fileArray.filter(file => file.size > field.maxFileSize!);
      if (oversizedFiles.length > 0) {
        // Handle error
        return;
      }
    }

    // Validate file count
    if (field.maxFiles && fileArray.length > field.maxFiles) {
      // Handle error
      return;
    }

    if (field.multiple) {
      onChange(fileArray);
    } else {
      onChange(fileArray[0]);
    }
  }, [field.maxFileSize, field.maxFiles, field.multiple, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  return (
    <div className="space-y-3">
      {/* File Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          error && touched && 'border-red-500 bg-red-50'
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            {field.type === 'image' ? (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-base text-gray-900 mb-2">
              {field.placeholder || 'Drop files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              {field.accept && `Accepted formats: ${field.accept}`}
              {field.maxFileSize && ` • Max size: ${(field.maxFileSize / 1024 / 1024).toFixed(1)}MB`}
              {field.maxFiles && ` • Max ${field.maxFiles} files`}
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <TouchOptimizedButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="primary"
              size="md"
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </TouchOptimizedButton>

            {/* Camera Button for mobile image uploads */}
            {field.type === 'image' && device.isTouch && (
              <TouchOptimizedButton
                type="button"
                onClick={() => {
                  // Create a new file input with camera capture
                  const cameraInput = document.createElement('input');
                  cameraInput.type = 'file';
                  cameraInput.accept = 'image/*';
                  cameraInput.capture = 'environment';
                  cameraInput.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    handleFileSelect(target.files);
                  };
                  cameraInput.click();
                }}
                variant="secondary"
                size="md"
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </TouchOptimizedButton>
            )}
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {value && (
        <div className="space-y-2">
          {Array.isArray(value) ? (
            value.map((file: File, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {field.type === 'image' ? (
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Upload className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <TouchOptimizedButton
                  type="button"
                  onClick={() => {
                    const newFiles = value.filter((_: any, i: number) => i !== index);
                    onChange(newFiles.length > 0 ? newFiles : null);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </TouchOptimizedButton>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {field.type === 'image' ? (
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{value.name}</p>
                  <p className="text-xs text-gray-500">
                    {(value.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <TouchOptimizedButton
                type="button"
                onClick={() => onChange(null)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </TouchOptimizedButton>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id={field.id}
        name={field.name}
        accept={field.accept}
        multiple={field.multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        onBlur={onBlur}
        className="hidden"
      />
    </div>
  );
}

// ============================================================================
// MAIN FORM COMPONENT
// ============================================================================

export function EnhancedMobileForm({
  sections,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  enableAutoSave = true,
  autoSaveInterval = 30000,
  enableProgressIndicator = true,
  enableSectionNavigation = true,
  enableValidationOnBlur = true,
  enableHapticFeedback = true,
  className = '',
  loading = false,
  error = null,
  success = null,
}: EnhancedMobileFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const device = useDeviceInfo();
  const announce = useA11yAnnouncement();
  const formRef = useRef<HTMLFormElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // SWIPE GESTURES FOR SECTION NAVIGATION
  // ============================================================================

  const swipeGestures = useSwipeGesture({
    onSwipeLeft: () => {
      if (enableSectionNavigation && currentSection < sections.length - 1) {
        goToNextSection();
      }
    },
    onSwipeRight: () => {
      if (enableSectionNavigation && currentSection > 0) {
        goToPreviousSection();
      }
    },
    threshold: 100,
  });

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================

  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.validation?.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    if (value && field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }

    if (value && field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters`;
    }

    if (value && field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `${field.label} must be no more than ${field.validation.maxLength} characters`;
    }

    if (value !== undefined && field.validation?.min && value < field.validation.min) {
      return `${field.label} must be at least ${field.validation.min}`;
    }

    if (value !== undefined && field.validation?.max && value > field.validation.max) {
      return `${field.label} must be no more than ${field.validation.max}`;
    }

    if (field.validation?.custom) {
      return field.validation.custom(value);
    }

    return null;
  }, []);

  const validateSection = useCallback((sectionIndex: number): FormErrors => {
    const section = sections[sectionIndex];
    const sectionErrors: FormErrors = {};

    // Validate individual fields
    section.fields.forEach(field => {
      if (shouldShowField(field)) {
        const error = validateField(field, values[field.name]);
        if (error) {
          sectionErrors[field.name] = error;
        }
      }
    });

    // Validate section-level rules
    if (section.validation) {
      const sectionValidationErrors = section.validation(values);
      Object.assign(sectionErrors, sectionValidationErrors);
    }

    return sectionErrors;
  }, [sections, values, validateField]);

  const validateAllSections = useCallback((): FormErrors => {
    const allErrors: FormErrors = {};
    
    sections.forEach((_, index) => {
      const sectionErrors = validateSection(index);
      Object.assign(allErrors, sectionErrors);
    });

    return allErrors;
  }, [sections, validateSection]);

  // ============================================================================
  // CONDITIONAL FIELD VISIBILITY
  // ============================================================================

  const shouldShowField = useCallback((field: FormField): boolean => {
    if (!field.conditional) return true;

    const { field: conditionField, operator, value: conditionValue } = field.conditional;
    const fieldValue = values[conditionField];

    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(conditionValue);
      case 'greater_than':
        return fieldValue > conditionValue;
      case 'less_than':
        return fieldValue < conditionValue;
      default:
        return true;
    }
  }, [values]);

  const shouldShowSection = useCallback((section: FormSection): boolean => {
    if (!section.conditional) return true;

    const { field, operator, value: conditionValue } = section.conditional;
    const fieldValue = values[field];

    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(conditionValue);
      default:
        return true;
    }
  }, [values]);

  // ============================================================================
  // VALUE MANAGEMENT
  // ============================================================================

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Schedule auto-save
    if (enableAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, autoSaveInterval);
    }

    // Haptic feedback for touch devices
    if (enableHapticFeedback && device.isTouch && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, [errors, enableAutoSave, autoSaveInterval, enableHapticFeedback, device.isTouch]);

  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (enableValidationOnBlur) {
      const field = sections.flatMap(s => s.fields).find(f => f.name === fieldName);
      if (field) {
        const error = validateField(field, values[fieldName]);
        if (error) {
          setErrors(prev => ({ ...prev, [fieldName]: error }));
        }
      }
    }
  }, [enableValidationOnBlur, sections, validateField, values]);

  // ============================================================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================================================

  const handleAutoSave = useCallback(async () => {
    setAutoSaveStatus('saving');
    
    try {
      // Save to localStorage
      localStorage.setItem(`form-autosave-${Date.now()}`, JSON.stringify(values));
      setAutoSaveStatus('saved');
      
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [values]);

  // ============================================================================
  // SECTION NAVIGATION
  // ============================================================================

  const goToNextSection = useCallback(() => {
    if (currentSection < sections.length - 1) {
      // Validate current section before proceeding
      const sectionErrors = validateSection(currentSection);
      if (Object.keys(sectionErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...sectionErrors }));
        announce('Please fix the errors before continuing', 'assertive');
        return;
      }

      setCurrentSection(prev => prev + 1);
      announce(`Moved to section ${currentSection + 2} of ${sections.length}`, 'polite');
    }
  }, [currentSection, sections.length, validateSection, announce]);

  const goToPreviousSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      announce(`Moved to section ${currentSection} of ${sections.length}`, 'polite');
    }
  }, [currentSection, sections.length, announce]);

  const goToSection = useCallback((sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      setCurrentSection(sectionIndex);
      announce(`Moved to section ${sectionIndex + 1} of ${sections.length}`, 'polite');
    }
  }, [sections.length, announce]);

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Validate all sections
      const allErrors = validateAllSections();
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        announce('Please fix all errors before submitting', 'assertive');
        return;
      }

      await onSubmit(values);
      announce('Form submitted successfully', 'polite');
      
      // Clear auto-save data on successful submit
      if (enableAutoSave) {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('form-autosave-'));
        keys.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      announce('Form submission failed. Please try again.', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllSections, onSubmit, values, announce, enableAutoSave]);

  // ============================================================================
  // RENDER FIELD
  // ============================================================================

  const renderField = useCallback((field: FormField) => {
    if (!shouldShowField(field)) return null;

    const fieldError = errors[field.name];
    const fieldTouched = touched[field.name];

    const commonProps = {
      field,
      value: values[field.name],
      onChange: (value: any) => handleFieldChange(field.name, value),
      onBlur: () => handleFieldBlur(field.name),
      error: fieldError,
      touched: fieldTouched,
    };

    let fieldComponent;

    switch (field.type) {
      case 'textarea':
        fieldComponent = <TextareaField {...commonProps} />;
        break;
      case 'select':
      case 'multiselect':
        fieldComponent = <SelectField {...commonProps} />;
        break;
      case 'checkbox':
        return <CheckboxField {...commonProps} />;
      case 'toggle':
        return <ToggleField {...commonProps} />;
      case 'file':
      case 'image':
        fieldComponent = <FileField {...commonProps} />;
        break;
      default:
        fieldComponent = <TextInputField {...commonProps} />;
    }

    if (field.type === 'checkbox' || field.type === 'toggle') {
      return fieldComponent;
    }

    return (
      <MobileFormField
        label={field.label}
        error={fieldTouched ? fieldError : undefined}
        required={field.required}
        className={field.className}
      >
        {fieldComponent}
        {field.description && (
          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
        )}
      </MobileFormField>
    );
  }, [shouldShowField, errors, touched, values, handleFieldChange, handleFieldBlur]);

  // ============================================================================
  // CURRENT SECTION DATA
  // ============================================================================

  const currentSectionData = sections[currentSection];
  const visibleSections = sections.filter(shouldShowSection);
  const isLastSection = currentSection === visibleSections.length - 1;
  const progressPercentage = ((currentSection + 1) / visibleSections.length) * 100;

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <MobileOptimized className={cn('max-w-2xl mx-auto', className)}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" {...swipeGestures}>
        {/* Progress Indicator */}
        {enableProgressIndicator && visibleSections.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Section {currentSection + 1} of {visibleSections.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progressPercentage)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Auto-save Status */}
        {enableAutoSave && autoSaveStatus !== 'idle' && (
          <motion.div
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm',
              autoSaveStatus === 'saving' && 'bg-yellow-50 text-yellow-800',
              autoSaveStatus === 'saved' && 'bg-green-50 text-green-800',
              autoSaveStatus === 'error' && 'bg-red-50 text-red-800'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {autoSaveStatus === 'saving' && <Save className="w-4 h-4 animate-spin" />}
            {autoSaveStatus === 'saved' && <Check className="w-4 h-4" />}
            {autoSaveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
            <span>
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'Saved automatically'}
              {autoSaveStatus === 'error' && 'Auto-save failed'}
            </span>
          </motion.div>
        )}

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            className="bg-white border border-gray-200 rounded-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentSectionData.title}
              </h2>
              {currentSectionData.description && (
                <p className="text-gray-600">{currentSectionData.description}</p>
              )}
            </div>

            {/* Section Fields */}
            <div className="space-y-6">
              {currentSectionData.fields.map(field => (
                <div key={field.id}>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex space-x-2">
            {currentSection > 0 && (
              <TouchOptimizedButton
                type="button"
                onClick={goToPreviousSection}
                variant="secondary"
                size="md"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </TouchOptimizedButton>
            )}

            {onCancel && (
              <TouchOptimizedButton
                type="button"
                onClick={onCancel}
                variant="ghost"
                size="md"
              >
                {cancelLabel}
              </TouchOptimizedButton>
            )}
          </div>

          <div className="flex space-x-2">
            {!isLastSection ? (
              <TouchOptimizedButton
                type="button"
                onClick={goToNextSection}
                variant="primary"
                size="md"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </TouchOptimizedButton>
            ) : (
              <TouchOptimizedButton
                type="submit"
                disabled={isSubmitting || loading}
                variant="primary"
                size="md"
              >
                {isSubmitting ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  submitLabel
                )}
              </TouchOptimizedButton>
            )}
          </div>
        </div>

        {/* Section Dots Navigation */}
        {enableSectionNavigation && visibleSections.length > 1 && (
          <div className="flex justify-center space-x-2">
            {visibleSections.map((_, index) => (
              <TouchOptimizedButton
                key={index}
                type="button"
                onClick={() => goToSection(index)}
                variant="ghost"
                size="sm"
                className={cn(
                  'w-3 h-3 rounded-full p-0',
                  index === currentSection ? 'bg-blue-600' : 'bg-gray-300'
                )}
                aria-label={`Go to section ${index + 1}`}
              />
            ))}
          </div>
        )}
      </form>
    </MobileOptimized>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default EnhancedMobileForm;