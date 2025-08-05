'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { 
import { DaisySelect, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue } from '@/components/ui/daisy-components';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import {
  Eye,
  EyeOff,
  Upload,
  X,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
  FileText,
  Image,
  File,
  Clock,
} from 'lucide-react';

// ========== FORM FIELD TYPES ==========
export interface FormFieldConfig {
  id: string
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'file' | 'toggle';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  value?: any;
  options?: Array<{ value: string; label: string; description?: string }>;
  width?: 'full' | 'half';
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fields: FormFieldConfig[];
}

// ========== FLOATING LABEL INPUT ==========
const FloatingLabelInput: React.FC<{
  field: FormFieldConfig
  value: any;
  onChange: (_value: any) => void;
  error?: string;
  autoSaved?: boolean;
}> = ({ field, value, onChange, error, autoSaved }) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = value && value.toString().length > 0;
  const isFloating = focused || hasValue;

  const getInputClasses = () => {
    return cn(
      "w-full px-enterprise-3 pt-enterprise-6 pb-enterprise-2 border rounded-lg transition-all duration-200 bg-white",
      "text-body-base text-text-primary placeholder-transparent",
      "focus:outline-none focus:ring-0",
      error 
        ? "border-semantic-error focus:border-semantic-error" 
        : focused 
          ? "border-interactive-primary focus:border-interactive-primary shadow-notion-sm" 
          : "border-border hover:border-border-hover",
      field.disabled && "bg-surface-secondary cursor-not-allowed opacity-60"
    );
  }

  const getLabelClasses = () => {
    return cn(
      "absolute left-enterprise-3 transition-all duration-200 pointer-events-none text-text-secondary",
      isFloating 
        ? "top-enterprise-2 text-caption font-medium transform -translate-y-0" 
        : "top-1/2 text-body-base transform -translate-y-1/2",
      focused && !error && "text-interactive-primary",
      error && "text-semantic-error"
    );
  }

  return (
    <div className={cn("space-y-enterprise-1", field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2')}>
      <div className="relative">
        {field.type === 'textarea' ? (
          <textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={field.disabled}
            className={cn(getInputClasses(), "min-h-24 resize-y")}
            placeholder={field.placeholder}
            rows={4}
            required={field.required} />
        ) : (
          <input
            type={field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type}
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={field.disabled}
            className={getInputClasses()}
            placeholder={field.placeholder}
            required={field.required} />
        )}
        
        <label htmlFor={field.id} className={getLabelClasses()}>
          {field.label}
          {field.required && <span className="text-semantic-error ml-1">*</span>}
        </label>

        {/* Password Toggle */}
        {field.type === 'password' && (
          <button
            type="button"
            className="absolute right-enterprise-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {/* Auto-save indicator */}
        {Boolean(autoSaved) && (
          <div className="absolute right-enterprise-3 top-enterprise-2">
            <Check className="h-3 w-3 text-semantic-success" />
          </div>
        )}
      </div>

      {/* Helper Text and Error Message */}
      {(field.helperText || error) && (
        <div className="flex items-start space-x-enterprise-2">
          {error ? (
            <DaisyAlertCircle className="h-3 w-3 text-semantic-error mt-0.5 flex-shrink-0" >
  ) : (
</DaisyAlertCircle>
            <Info className="h-3 w-3 text-text-tertiary mt-0.5 flex-shrink-0" />
          )}
          <p className={cn(
            "text-caption",
            error ? "text-semantic-error" : "text-text-secondary"
          )}>
            {error || field.helperText}
          </p>
        </div>
      )}
    </div>
  );
}

// ========== SELECT COMPONENT ==========
const NotionSelect: React.FC<{
  field: FormFieldConfig
  value: any;
  onChange: (_value: any) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  return (
    <div className={cn("space-y-enterprise-1", field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2')}>
      <label className="block text-body-sm font-medium text-text-primary">
        {field.label}
        {field.required && <span className="text-semantic-error ml-1">*</span>}
      </label>
      
      <DaisySelect value={value} onValueChange={onChange} disabled={field.disabled} >
          <DaisySelectTrigger className={cn(
          "w-full h-12 px-enterprise-3 border rounded-lg bg-white transition-all duration-200",
          error 
            ? "border-semantic-error focus:border-semantic-error" 
            : "border-border hover:border-border-hover focus:border-interactive-primary focus:shadow-notion-sm",
          field.disabled && "bg-surface-secondary cursor-not-allowed opacity-60"
        )}>
            <DaisySelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
</DaisySelect>
        <DaisySelectContent className="max-h-64" >
            {field.options?.map((option) => (
            <DaisySelectItem key={option.value} value={option.value} >
                <div className="flex flex-col">
                <span className="text-body-sm font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-caption text-text-secondary">{option.description}</span>
                )}
              </div>
            </DaisySelectContent>
          ))}
        </DaisySelectContent>
      </DaisySelect>

      {(field.helperText || error) && (
        <div className="flex items-start space-x-enterprise-2">
          {error ? (
            <DaisyAlertCircle className="h-3 w-3 text-semantic-error mt-0.5 flex-shrink-0" >
  ) : (
</DaisyAlertCircle>
            <Info className="h-3 w-3 text-text-tertiary mt-0.5 flex-shrink-0" />
          )}
          <p className={cn(
            "text-caption",
            error ? "text-semantic-error" : "text-text-secondary"
          )}>
            {error || field.helperText}
          </p>
        </div>
      )}
    </div>
  );
}

// ========== TOGGLE SWITCH ==========
const NotionToggle: React.FC<{
  field: FormFieldConfig
  value: boolean;
  onChange: (_value: boolean) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  return (
    <div className={cn("space-y-enterprise-1", field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2')}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-body-sm font-medium text-text-primary">
            {field.label}
            {field.required && <span className="text-semantic-error ml-1">*</span>}
          </label>
          {field.helperText && (
            <p className="text-caption text-text-secondary mt-enterprise-1">
              {field.helperText}
            </p>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => onChange(!value)}
          disabled={field.disabled}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
            value 
              ? "bg-interactive-primary" 
              : "bg-surface-secondary",
            field.disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              value ? "translate-x-5" : "translate-x-0"
            )} />
        </button>
      </div>

      {Boolean(error) && (
        <div className="flex items-start space-x-enterprise-2">
          <DaisyAlertCircle className="h-3 w-3 text-semantic-error mt-0.5 flex-shrink-0" >
  <p className="text-caption text-semantic-error">
</DaisyAlertCircle>{error}</p>
        </div>
      )}
    </div>
  );
}

// ========== FILE UPLOAD ==========
const NotionFileUpload: React.FC<{
  field: FormFieldConfig
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onChange([...value, ...files]);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    onChange([...value, ...files]);
  }

  const removeFile = (_index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  }

  const getFileIcon = (_file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  }

  return (
    <div className={cn("space-y-enterprise-3", field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2')}>
      <label className="block text-body-sm font-medium text-text-primary">
        {field.label}
        {field.required && <span className="text-semantic-error ml-1">*</span>}
      </label>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-enterprise-6 text-center transition-all duration-200 cursor-pointer",
          dragOver 
            ? "border-interactive-primary bg-interactive-primary/5" 
            : "border-border hover:border-border-hover",
          error && "border-semantic-error"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
        <p className="text-body-sm font-medium text-text-primary mb-enterprise-1">
          Click to upload or drag and drop
        </p>
        <p className="text-caption text-text-secondary">
          {field.helperText || "Supported formats: PDF, DOC, DOCX, JPG, PNG"}
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={field.disabled} />
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-enterprise-2">
          {value.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-enterprise-3 border border-border rounded-lg bg-surface-secondary/30">
              <div className="flex items-center space-x-enterprise-2">
                {getFileIcon(file)}
                <div>
                  <p className="text-body-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-caption text-text-secondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <DaisyButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0 text-text-tertiary hover:text-semantic-error" />
                <X className="h-3 w-3" />
              </DaisyButton>
            </div>
          ))}
        </div>
      )}

      {Boolean(error) && (
        <div className="flex items-start space-x-enterprise-2">
          <DaisyAlertCircle className="h-3 w-3 text-semantic-error mt-0.5 flex-shrink-0" >
  <p className="text-caption text-semantic-error">
</DaisyAlertCircle>{error}</p>
        </div>
      )}
    </div>
  );
}

// ========== FORM SECTION ==========
const FormSection: React.FC<{
  section: FormSectionConfig
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: any) => void;
  autoSavedFields?: Set<string>;
}> = ({ section, values, errors, onChange, autoSavedFields }) => {
  const [expanded, setExpanded] = useState(section.defaultExpanded ?? true);

  const renderField = (field: FormFieldConfig) => {
    const fieldValue = values[field.id];
    const fieldError = errors[field.id];
    const autoSaved = autoSavedFields?.has(field.id);

    switch (field.type) {
      case 'select':
        return (
          <NotionSelect
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={(value) => onChange(field.id, value)}
            error={fieldError} />
        );
      case 'toggle':
        return (
          <NotionToggle
            key={field.id}
            field={field}
            value={fieldValue || false}
            onChange={(value) => onChange(field.id, value)}
            error={fieldError} />
        );
      case 'file':
        return (
          <NotionFileUpload
            key={field.id}
            field={field}
            value={fieldValue || []}
            onChange={(files) => onChange(field.id, files)}
            error={fieldError} />
        );
      default:
        return (
          <FloatingLabelInput
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={(value) => onChange(field.id, value)}
            error={fieldError}
            autoSaved={autoSaved} />
        );
    }
  }

  return (
    <div className="space-y-enterprise-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-sm font-semibold text-text-primary">
            {section.title}
          </h3>
          {section.description && (
            <p className="text-body-sm text-text-secondary mt-enterprise-1">
              {section.description}
            </p>
          )}
        </div>
        
        {section.collapsible && (
          <DaisyButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0" />
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </DaisyButton>
        )}
      </div>

      {/* Section Content */}
      {Boolean(expanded) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-enterprise-4">
          {section.fields.map(renderField)}
        </div>
      )}
    </div>
  );
}

// ========== MAIN FORM COMPONENT ==========
export const NotionForm: React.FC<{
  title: string
  description?: string;
  sections: FormSectionConfig[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (fieldId: string, value: any) => void;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  loading?: boolean;
  autoSave?: boolean;
  className?: string;
}> = ({ 
  title, 
  description, 
  sections, 
  values, 
  errors = {}, 
  onChange, 
  onSubmit, 
  onCancel, 
  loading = false,
  autoSave = false,
  className 
}) => {
  const [autoSavedFields, setAutoSavedFields] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleFieldChange = (fieldId: string, value: any) => {
    onChange(fieldId, value);
    
    if (autoSave) {
      // Simulate auto-save
      setTimeout(() => {
        setAutoSavedFields(prev => new Set([...prev, fieldId]))
        setLastSaved(new Date());
        
        // Remove auto-save indicator after 2 seconds
        setTimeout(() => {
          setAutoSavedFields(prev => {
            const newSet = new Set(prev)
            newSet.delete(fieldId);
            return newSet;
          });
        }, 2000);
      }, 1000);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-enterprise-8", className)}>
      {/* Form Header */}
      <div className="space-y-enterprise-2">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-lg font-bold text-text-primary">{title}</h2>
          {Boolean(autoSave) && lastSaved && (
            <div className="flex items-center space-x-enterprise-2 text-caption text-text-secondary">
              <Clock className="h-3 w-3" />
              <span>Last saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        {Boolean(description) && (
          <p className="text-body-base text-text-secondary">{description}</p>
        )}
      </div>

      <DaisySeparator />
{/* Form Sections */}
      <div className="space-y-enterprise-8">
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <FormSection
              section={section}
              values={values}
              errors={errors}
              onChange={handleFieldChange}
              autoSavedFields={autoSavedFields} />
            {index < sections.length - 1 && <DaisySeparator />
}
          </React.Fragment>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-enterprise-6 border-t border-border">
        <div className="flex items-center space-x-enterprise-2">
          {Boolean(onCancel) && (
            <DaisyButton type="button" variant="outline" onClick={onCancel} >
  Cancel
</DaisySeparator>
            </DaisyButton>
          )}
          <DaisyButton type="button" variant="ghost" disabled={loading} >
  <RotateCcw className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
            Reset
          </DaisyButton>
        </div>
        
        <div className="flex items-center space-x-enterprise-2">
          {!autoSave && (
            <DaisyButton type="button" variant="outline" disabled={loading} >
  <Save className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
              Save Draft
            </DaisyButton>
          )}
          <DaisyButton type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}

        </DaisyButton>
          </DaisyButton>
        </div>
      </div>
    </form>
  );
}

export default NotionForm; 