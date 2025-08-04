#!/usr/bin/env tsx

/**
 * DaisyUI Component Template Generator
 *
 * This script generates standardized component templates following
 * the established patterns for DaisyUI components.
 */

import fs from 'fs';
import path from 'path';

interface ComponentTemplate {
  name: string;
  type: 'card' | 'dialog' | 'form' | 'tabs' | 'list' | 'dashboard';
  description: string;
  template: string;
  imports: string[];
  usage?: string;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    name: 'StandardCard',
    type: 'card',
    description: 'Basic card component with proper DaisyUI structure',
    imports: [
      "import { DaisyCard, DaisyCardBody, DaisyCardTitle, DaisyCardActions } from '@/components/ui/DaisyCard';",
      "import { DaisyButton } from '@/components/ui/DaisyButton';",
      "import { cn } from '@/lib/utils';",
    ],
    template: `interface StandardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  compact?: boolean;
  bordered?: boolean;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  children,
  className,
  actions,
  compact = false,
  bordered = true,
}) => {
  return (
    <DaisyCard 
      className={cn('shadow-sm', className)} 
      compact={compact} 
      bordered={bordered}
    >
      <DaisyCardBody>
        <DaisyCardTitle className="flex items-center justify-between">
          {title}
        </DaisyCardTitle>
        {children}
        {Boolean(actions) && (
          <DaisyCardActions>
            {actions}
          </DaisyCardActions>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
};`,
    usage: `<StandardCard 
  title="Risk Assessment" 
  actions={<DaisyButton variant="primary">
          View Details
        </DaisyButton>}
>
  <p>Card content goes here</p>
</StandardCard>`,
  },

  {
    name: 'StandardDialog',
    type: 'dialog',
    description: 'Dialog component with proper structure and error handling',
    imports: [
      "import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogDescription, DaisyDialogFooter } from '@/components/ui/DaisyDialog';",
      "import { DaisyButton } from '@/components/ui/DaisyButton';",
      "import { useState } from 'react';",
    ],
    template: `interface StandardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const StandardDialog: React.FC<StandardDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  maxWidth = 'md',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }

  return (
    <DaisyDialog open={open} onOpenChange={onOpenChange}>
      <DaisyDialogContent className={\`\${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto\`}>
        <DaisyDialogHeader>
          <DaisyDialogTitle>{title}</DaisyDialogTitle>
          {Boolean(description) && (
            <DaisyDialogDescription>
              {description}
            </DaisyDialogDescription>
          )}
        </DaisyDialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        {(onConfirm || onCancel) && (
          <DaisyDialogFooter>
            {Boolean(onCancel) && (
              <DaisyButton
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}>
          {cancelText}
              
        </DaisyButton>
            )}
            {Boolean(onConfirm) && (
              <DaisyButton
                onClick={onConfirm}
                disabled={isLoading}
                loading={isLoading}>
          {confirmText}
              
        </DaisyButton>
            )}
          </DaisyDialogFooter>
        )}
      </DaisyDialogContent>
    </DaisyDialog>
  );
};`,
    usage: `<StandardDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  onConfirm={handleConfirm}
  onCancel={() => setIsOpen(false)}
>
  <p>Dialog content goes here</p>
</StandardDialog>`,
  },

  {
    name: 'StandardForm',
    type: 'form',
    description: 'Form component with validation and error handling',
    imports: [
      "import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';",
      "import { DaisyButton } from '@/components/ui/DaisyButton';",
      "import { DaisyInput } from '@/components/ui/DaisyInput';",
      "import { DaisyLabel } from '@/components/ui/DaisyLabel';",
      "import { DaisyTextarea } from '@/components/ui/DaisyTextarea';",
      "import { useState } from 'react';",
      "import { cn } from '@/lib/utils';",
      "import { AlertCircle } from 'lucide-react';",
    ],
    template: `interface FormField {
  id: string;
  label: string;
  type: 'input' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  validation?: (_value: string) => string | null;
}

interface StandardFormProps {
  title: string;
  fields: FormField[];
  onSubmit: (_data: Record<string, string>) => Promise<void>;
  submitText?: string;
  isLoading?: boolean;
  className?: string;
}

export const StandardForm: React.FC<StandardFormProps> = ({
  title,
  fields,
  onSubmit,
  submitText = 'Submit',
  isLoading = false,
  className,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    fields.forEach(field => {
      const value = formData[field.id] || '';
      
      if (field.required && !value.trim()) {
        newErrors[field.id] = \`\${field.label} is required\`;
      } else if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.id] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // console.error('Form submission error:', error)
    }
  }

  const updateField = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  }

  return (
    <DaisyCard className={className}>
      <DaisyCardBody>
        <DaisyCardTitle>{title}</DaisyCardTitle>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-2">
              <DaisyLabel htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </DaisyLabel>
              
              {field.type === 'input' && (
                <DaisyInput
                  id={field.id}
                  type="text"
                  placeholder={field.placeholder}
                  value={formData[field.id] || ''}
                  onChange={(e) = />
updateField(field.id, e.target.value)}
                  className={cn(errors[field.id] && 'border-red-500')} />
              )}
              
              {field.type === 'textarea' && (
                <DaisyTextarea
                  id={field.id}
                  placeholder={field.placeholder}
                  value={formData[field.id] || ''}
                  onChange={(e) = />
updateField(field.id, e.target.value)}
                  className={cn(errors[field.id] && 'border-red-500')}
                  rows={4} />
              )}
              
              {errors[field.id] && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors[field.id]}
                </p>
              )}
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <DaisyButton
              type="submit"
              disabled={isLoading}
              loading={isLoading}>
          {submitText}
            
        </DaisyButton>
          </div>
        </form>
      </DaisyCardBody>
    </DaisyCard>
  );
};`,
    usage: `<StandardForm
  title="Create Risk"
  fields={[
    { id: 'title', label: 'Risk Title', type: 'input', required: true },
    { id: 'description', label: 'Description', type: 'textarea', required: true }
  ]}
  onSubmit={handleFormSubmit} />`,
  },

  {
    name: 'StandardTabs',
    type: 'tabs',
    description: 'Tabs component with proper structure',
    imports: [
      "import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';",
      "import { useState } from 'react';",
    ],
    template: `interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface StandardTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const StandardTabs: React.FC<StandardTabsProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }

  return (
    <DaisyTabs 
      value={activeTab} 
      onValueChange={handleTabChange}
      className={className}
    >
      <DaisyTabsList className={\`grid w-full grid-cols-\${tabs.length}\`}>
        {tabs.map((tab) => (
          <DaisyTabsTrigger 
            key={tab.id} 
            value={tab.id}
            disabled={tab.disabled}
          >
            {tab.label}
          </DaisyTabsTrigger>
        ))}
      </DaisyTabsList>
      
      {tabs.map((tab) => (
        <DaisyTabsContent 
          key={tab.id} 
          value={tab.id}
          className="space-y-4"
        >
          {tab.content}
        </DaisyTabsContent>
      ))}
    </DaisyTabs>
  );
};`,
    usage: `<StandardTabs
  tabs={[
    { id: 'overview', label: 'Overview', content: <OverviewContent /> },
    { id: 'details', label: 'Details', content: <DetailsContent /> }
  ]}
  onTabChange={(tabId) => console.log('Active tab:', tabId)} />`,
  },

  {
    name: 'StandardDataList',
    type: 'list',
    description: 'Data list component with loading and empty states',
    imports: [
      "import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';",
      "import { DaisyButton } from '@/components/ui/DaisyButton';",
      "import { DaisyBadge } from '@/components/ui/DaisyBadge';",
      "import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';",
      "import { Loader2, RefreshCw } from 'lucide-react';",
    ],
    template: `interface DataItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: 'active' | 'inactive' | 'pending';
  metadata?: Record<string, any>;
}

interface StandardDataListProps<T extends DataItem> {
  title: string;
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onItemClick?: (item: T) => void;
  renderItem?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  maxHeight?: string;
}

export function StandardDataList<T extends DataItem>({
  title,
  data,
  isLoading = false,
  error = null,
  onRefresh,
  onItemClick,
  renderItem,
  emptyMessage = 'No items found',
  maxHeight = '400px',
}: StandardDataListProps<T>) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-error';
      case 'pending': return 'badge-warning';
      default: return 'badge-ghost';
    }
  }

  const defaultRenderItem = (item: T) => (
    <div
      key={item.id}
      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onItemClick?.(item)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.title}</h4>
          {item.subtitle && (
            <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>
          )}
        </div>
        {item.status && (
          <DaisyBadge className={getStatusColor(item.status)}>
            {item.status}
          </DaisyBadge>
        )}
      </div>
    </div>
  );

  return (
    <DaisyCard>
      <DaisyCardBody>
        <DaisyCardTitle className="flex items-center justify-between">
          {title}
          {Boolean(onRefresh) && (
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={\`h-4 w-4 \${isLoading ? 'animate-spin' : ''}\`} />
            </DaisyButton>
          )}
        </DaisyCardTitle>

        {Boolean(error) && (
          <div className="text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        <DaisyScrollArea style={{ maxHeight }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <div>
              {data.map(item => 
                renderItem ? renderItem(item) : defaultRenderItem(item)
              )}
            </div>
          )}
        </DaisyScrollArea>
      </DaisyCardBody>
    </DaisyCard>
  );
}`,
    usage: `<StandardDataList
  title="Recent Risks"
  data={risks}
  isLoading={loading}
  onRefresh={fetchRisks}
  onItemClick={(risk) => navigate(\`/risks/\${risk.id}\`)} />`,
  },
];

class ComponentTemplateGenerator {
  private outputDir: string;

  constructor(outputDir: string = 'src/components/templates') {
    this.outputDir = path.resolve(outputDir);
  }

  async generateAllTemplates(): Promise<void> {
    // console.log('🏗️  Generating DaisyUI component templates...')

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }

    // Generate individual template files
    for (const template of COMPONENT_TEMPLATES) {
      await this.generateTemplate(template)
    }

    // Generate index file
    await this.generateIndexFile()

    // Generate README
    await this.generateReadme()

    // console.log(
      `✅ Generated ${COMPONENT_TEMPLATES.length} component templates in ${this.outputDir}`
    )
  }

  private async generateTemplate(template: ComponentTemplate): Promise<void> {
    const filename = `${template.name}.tsx`;
    const filepath = path.join(this.outputDir, filename);

    const content = `'use client';

/**
 * ${template.description}
 * 
 * This is a standardized ${template.type} component following DaisyUI best practices.
    * DaisyUI component template
 */

import React from 'react';
${template.imports.join('\n')}

${template.template}

export default ${template.name}

/**
 * Usage Example:
 * 
 * ${template.usage || `<${template.name} />`}
 */
`;

    fs.writeFileSync(filepath, content);
    // console.log(`📄 Generated: ${filename}`)
  }

  private async generateIndexFile(): Promise<void> {
    const indexPath = path.join(this.outputDir, 'index.ts');

    const exports = COMPONENT_TEMPLATES.map(
      (t) => `export { default as ${t.name} } from './${t.name}';`
    ).join('\n');

    const content = `/**
 * DaisyUI Component Templates
 * 
 * Standardized component templates following best practices.
    * DaisyUI component template
 */

${exports}

// Re-export types for convenience
export type { ComponentTemplate } from '../scripts/generate-daisy-templates'
`;

    fs.writeFileSync(indexPath, content);
    // console.log('📄 Generated: index.ts')
  }

  private async generateReadme(): Promise<void> {
    const readmePath = path.join(this.outputDir, 'README.md');

    const templateList = COMPONENT_TEMPLATES.map(
      (t) => `- **${t.name}** (\`${t.type}\`): ${t.description}`
    ).join('\n');

    const usage = COMPONENT_TEMPLATES.map(
      (t) => `### ${t.name}\n\n${t.description}\n\n\`\`\`tsx\n${t.usage || `<${t.name} />`}\n\`\`\``
    ).join('\n\n');

    const content = `# DaisyUI Component Templates

This directory contains standardized component templates that follow DaisyUI best practices and the Riscura component architecture.

## Available Templates

${templateList}

## Usage

Import the templates you need:

\`\`\`tsx
// import { StandardCard, StandardDialog, StandardForm } from '@/components/templates'
\`\`\`

## Template Examples

${usage}

## Best Practices

1. **Always use proper component nesting**: Container components should have opening/closing tags
2. **Handle loading and error states**: All components should gracefully handle async operations
3. **Provide proper TypeScript types**: Ensure all props are properly typed
4. **Use consistent styling**: Follow the established design system
5. **Implement accessibility**: Include proper ARIA attributes and keyboard navigation

## Customization

These templates are starting points. Feel free to extend them for your specific use cases while maintaining the core patterns.

## Contributing

When adding new templates:

1. Follow the existing naming convention
2. Include proper TypeScript types
3. Add usage examples
4. Test with the audit script: \`npm run audit:daisy-components\`

---

*DaisyUI Component Templates*
`;

    fs.writeFileSync(readmePath, content);
    // console.log('📄 Generated: README.md')
  }
}

// CLI execution
async function main() {
  const generator = new ComponentTemplateGenerator()

  try {
    await generator.generateAllTemplates();
    // console.log('🎉 Template generation completed successfully!')
  } catch (error) {
    // console.error('❌ Template generation failed:', error)
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch(console.error)
}

export { ComponentTemplateGenerator, COMPONENT_TEMPLATES, type ComponentTemplate }
