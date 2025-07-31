'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyRadioGroup, DaisyRadioGroupItem } from '@/components/ui/DaisyRadioGroup';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  Info,
  Save,
  Upload,
  Camera,
  Mic,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Search
} from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'date' | 'time' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => string | null;
  options?: { value: string; label: string }[];
  description?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  accept?: string; // for file inputs
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email' | 'url';
  disabled?: boolean;
  hidden?: boolean;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}

interface MobileFormLayoutProps {
  title: string;
  description?: string;
  sections: FormSection[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  showProgress?: boolean;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
  loading?: boolean;
  errors?: Record<string, string>;
  validationMode?: 'onSubmit' | 'onChange' | 'onBlur';
}

export default function MobileFormLayout({
  title,
  description,
  sections,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  showProgress = true,
  stickyHeader = true,
  stickyFooter = true,
  autoSave = false,
  autoSaveInterval = 30000,
  className = '',
  loading = false,
  errors = {},
  validationMode = 'onBlur'
}: MobileFormLayoutProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultExpanded !== false).map(s => s.id))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return;
    
    const interval = setInterval(() => {
      handleAutoSave();
    }, autoSaveInterval);
    
    return () => clearInterval(interval);
  }, [autoSave, isDirty, formData, autoSaveInterval]);
  
  // Swipe gestures for section navigation
  const bind = useGesture({
    onDrag: ({ direction: [dx], velocity: [vx], cancel }) => {
      if (Math.abs(vx) < 0.5) return;
      
      // Swipe left to go to next section
      if (dx < 0 && currentStep < sections.length - 1) {
        setCurrentStep(prev => prev + 1);
        cancel();
      }
      // Swipe right to go to previous section
      else if (dx > 0 && currentStep > 0) {
        setCurrentStep(prev => prev - 1);
        cancel();
      }
    }
  });
  
  // Handle form data changes
  const handleFieldChange = (fieldId: string, value: any) => {
    const newData = { ...formData, [fieldId]: value };
    setFormData(newData);
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (localErrors[fieldId]) {
      setLocalErrors(prev => {
        const { [fieldId]: removed, ...rest } = prev;
        return rest;
      });
    }
    
    // Validate on change if enabled
    if (validationMode === 'onChange') {
      validateField(fieldId, value);
    }
  };
  
  // Validate individual field
  const validateField = (fieldId: string, value: any): string | null => {
    const field = sections.flatMap(s => s.fields).find(f => f.id === fieldId);
    if (!field) return null;
    
    let error: string | null = null;
    
    // Required validation
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      error = `${field.label} is required`;
    }
    
    // Custom validation
    if (!error && field.validation && value) {
      error = field.validation(value);
    }
    
    // Type-specific validation
    if (!error && value) {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address';
          }
          break;
        case 'tel':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            error = 'Please enter a valid phone number';
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            error = 'Please enter a valid URL';
          }
          break;
        case 'number':
          if (isNaN(value)) {
            error = 'Please enter a valid number';
          } else {
            if (field.min !== undefined && value < field.min) {
              error = `Value must be at least ${field.min}`;
            }
            if (field.max !== undefined && value > field.max) {
              error = `Value must be at most ${field.max}`;
            }
          }
          break;
      }
    }
    
    if (error) {
      setLocalErrors(prev => ({ ...prev, [fieldId]: error }));
    } else {
      setLocalErrors(prev => {
        const { [fieldId]: removed, ...rest } = prev;
        return rest;
      });
    }
    
    return error;
  };
  
  // Validate all fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (!field.hidden && !field.disabled) {
          const error = validateField(field.id, formData[field.id]);
          if (error) {
            newErrors[field.id] = error;
          }
        }
      });
    });
    
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle auto-save
  const handleAutoSave = async () => {
    if (!isDirty) return;
    
    try {
      // Here you would typically save to localStorage or send to server
      localStorage.setItem(`form-draft-${title}`, JSON.stringify(formData));
      setLastAutoSave(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationMode !== 'onSubmit' || validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        setIsDirty(false);
        // Clear draft on successful submission
        localStorage.removeItem(`form-draft-${title}`);
      } catch (error) {
        console.error('Form submission failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (fieldId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };
  
  // Render form field
  const renderField = (field: FormField) => {
    if (field.hidden) return null;
    
    const value = formData[field.id] || '';
    const error = localErrors[field.id] || errors[field.id];
    const isRequired = field.required;
    
    const fieldProps = {
      id: field.id,
      value,
      onChange: (e: any) => handleFieldChange(field.id, e.target?.value || e),
      onBlur: () => {
        if (validationMode === 'onBlur') {
          validateField(field.id, value);
        }
      },
      disabled: field.disabled || loading,
      className: `${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} text-base`, // Prevent zoom on iOS
      'aria-invalid': !!error,
      'aria-describedby': error ? `${field.id}-error` : field.description ? `${field.id}-description` : undefined,
      autoComplete: field.autoComplete,
      inputMode: field.inputMode,
      pattern: field.pattern,
      maxLength: field.maxLength,
      min: field.min,
      max: field.max,
      step: field.step
    };
    
    const renderInput = () => {
      switch (field.type) {
        case 'textarea':

  return (
    <DaisyTextarea
              {...fieldProps}
              placeholder={field.placeholder}
              rows={field.rows || 3}
            />
          );
          
        case 'select':
          return (
            <DaisySelect value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
              <DaisySelectTrigger className={error ? 'border-red-500' : ''}>
                <DaisySelectValue placeholder={field.placeholder} />
              </DaisySelectTrigger>
              <DaisySelectContent>
                {field.options?.map(option => (
                  <DaisySelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </DaisySelect>
          );
          
        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <DaisyCheckbox
                id={field.id}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                disabled={field.disabled}
                aria-describedby={error ? `${field.id}-error` : field.description ? `${field.id}-description` : undefined}
              />
              <DaisyLabel htmlFor={field.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {field.label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </DaisyLabel>
            </div>
          );
          
        case 'radio':
          return (
            <DaisyRadioGroup value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <DaisyRadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <DaisyLabel htmlFor={`${field.id}-${option.value}`}>{option.label}</DaisyLabel>
                </div>
              ))}
            </DaisyRadioGroup>
          );
          
        case 'switch':
          return (
            <div className="flex items-center space-x-2">
              <DaisySwitch
                id={field.id}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                disabled={field.disabled}
              />
              <DaisyLabel htmlFor={field.id}>{field.label}</DaisyLabel>
            </div>
          );
          
        case 'file':
          return (
            <div className="space-y-2">
              <DaisyInput
                type="file"
                {...fieldProps}
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => {
                  const files = e.target.files;
                  handleFieldChange(field.id, field.multiple ? Array.from(files || []) : files?.[0] || null);
                }}
                className="hidden"
              />
              <DaisyLabel
                htmlFor={field.id}
                className="flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {field.placeholder || 'Tap to upload file'}
                  </p>
                  {field.accept && (
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted: {field.accept}
                    </p>
                  )}
                </div>
              </DaisyLabel>
              {value && (
                <div className="text-sm text-gray-600">
                  {field.multiple && Array.isArray(value) 
                    ? `${value.length} file(s) selected`
                    : value?.name || 'File selected'
                  }
                </div>
              )}
            </div>
          );
          
        case 'password':
          return (
            <div className="relative">
              <DaisyInput
                {...fieldProps}
                type={showPassword[field.id] ? 'text' : 'password'}
                placeholder={field.placeholder}
              />
              <DaisyButton
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility(field.id)}
                aria-label={showPassword[field.id] ? 'Hide password' : 'Show password'}
              >
                {showPassword[field.id] ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </DaisyButton>
            </div>
          );
          
        default:
          return (
            <div className="relative">
              {field.icon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {field.icon}
                </div>
              )}
              <DaisyInput
                {...fieldProps}
                type={field.type}
                placeholder={field.placeholder}
                className={`${field.icon ? 'pl-10' : ''} ${fieldProps.className}`}
              />
            </div>
          );
      }
    };
    
    return (
      <div key={field.id} className="space-y-2">
        {field.type !== 'checkbox' && field.type !== 'switch' && (
          <DaisyLabel htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </DaisyLabel>
        )}
        
        {renderInput()}
        
        {field.description && (
          <p id={`${field.id}-description`} className="text-xs text-gray-500">
            {field.description}
          </p>
        )}
        
        {error && (
          <p id={`${field.id}-error`} className="text-xs text-red-600 flex items-center">
            <DaisyAlertTriangle className="w-3 h-3 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };
  
  // Calculate progress
  const totalFields = sections.flatMap(s => s.fields.filter(f => !f.hidden)).length;
  const completedFields = sections.flatMap(s => s.fields.filter(f => !f.hidden))
    .filter(f => {
      const value = formData[f.id];
      return value !== undefined && value !== null && value !== '';
    }).length;
  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      {stickyHeader && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onCancel && (
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="p-2"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </DaisyButton>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                {showProgress && (
                  <div className="text-xs text-gray-500">
                    {Math.round(progress)}% complete • {completedFields} of {totalFields} fields
                  </div>
                )}
              </div>
            </div>
            
            {autoSave && lastAutoSave && (
              <div className="text-xs text-gray-500">
                Saved {lastAutoSave.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {showProgress && (
            <DaisyProgress value={progress} className="mt-2 h-1" />
          )}
        </div>
      )}
      
      {/* Form Content */}
      <form ref={formRef} onSubmit={handleSubmit} className="pb-20">
        <div ref={scrollRef} className="px-4 py-4 space-y-6" {...bind()}>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          
          {sections.map((section, index) => {
            const isExpanded = expandedSections.has(section.id);
            const isCurrentStep = index === currentStep;
            
            return (
              <DaisyCard key={section.id} className={`${isCurrentStep ? 'ring-2 ring-blue-500' : ''}`}>
                <DaisyCardHeader 
                  className={`${section.collapsible ? 'cursor-pointer' : ''} pb-3`}
                  onClick={() => section.collapsible && toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {section.icon}
                      <div>
                        <DaisyCardTitle className="text-base">{section.title}</DaisyCardTitle>
                        {section.description && (
                          <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DaisyBadge variant="secondary" className="text-xs">
                        {index + 1} of {sections.length}
                      </DaisyBadge>
                      {section.collapsible && (
                        <DaisyButton variant="ghost" size="sm" className="p-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </DaisyButton>
                      )}
                    </div>
                  </div>
                
                
                {(!section.collapsible || isExpanded) && (
                  <DaisyCardContent className="space-y-4">
                    {section.fields.map(field => renderField(field))}
                  </DaisyCardContent>
                )}
              </DaisyCard>
            );
          })}
        </div>
      </form>
      
      {/* Footer */}
      {stickyFooter && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <div className="flex space-x-3">
            {onCancel && (
              <DaisyButton
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                {cancelLabel}
              </DaisyButton>
            )}
            
            <DaisyButton
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </DaisyButton>
          </div>
          
          {isDirty && (
            <p className="text-xs text-gray-500 text-center mt-2">
              You have unsaved changes
            </p>
          )}
        </div>
      )}
      
      {/* Section Navigation */}
      {sections.length > 1 && (
        <div className="fixed bottom-20 left-4 right-4 flex justify-between z-30">
          <DaisyButton
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="bg-white shadow-lg"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </DaisyButton>
          
          <DaisyButton
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(prev => Math.min(sections.length - 1, prev + 1))}
            disabled={currentStep === sections.length - 1}
            className="bg-white shadow-lg"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </DaisyButton>
        </div>
      )}
    </div>
  );
} 