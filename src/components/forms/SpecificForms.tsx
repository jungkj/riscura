'use client';

import React, { useState } from 'react';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { NotionForm, FormSectionConfig } from './NotionForms';
// import {
  Shield,
  Users,
  Settings,
  FileCheck,
  AlertTriangle,
  UserPlus,
  Cog,
  Save,
} from 'lucide-react';

// ========== RISK ASSESSMENT FORM ==========
export const RiskAssessmentForm: React.FC = () => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formSections: FormSectionConfig[] = [
    {
      id: 'basic-info',
      title: 'Risk Identification',
      description: 'Provide basic information about the identified risk',
      fields: [
        {
          id: 'risk-title',
          label: 'Risk Title',
          type: 'text',
          required: true,
          placeholder: 'Enter a descriptive title for this risk',
          helperText: 'Use a clear, concise title that describes the risk',
          width: 'full',
        },
        {
          id: 'risk-category',
          label: 'Risk Category',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'cybersecurity', label: 'Cybersecurity' },
            { value: 'operational', label: 'Operational' },
            { value: 'financial', label: 'Financial' },
            { value: 'regulatory', label: 'Regulatory' },
          ],
        },
        {
          id: 'risk-description',
          label: 'Risk Description',
          type: 'textarea',
          required: true,
          placeholder: 'Provide a detailed description of the risk...',
          width: 'full',
        },
      ],
    },
  ];

  const handleFormChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (values: Record<string, any>) => {
    // console.log('Risk Assessment submitted:', values);
  };

  return (
    <MainContentArea
      title="Risk Assessment"
      subtitle="Identify, assess, and plan mitigation for organizational risks"
      breadcrumbs={[
        { label: 'Risk Management', href: '/dashboard/risks' },
        { label: 'New Assessment', current: true },
      ]}
      primaryAction={{
        label: 'Save Assessment',
        onClick: () => console.log('Save'),
        icon: Save,
      }}
      maxWidth="2xl"
    >
      <NotionForm
        title="Risk Assessment Form"
        description="Complete this form to document and assess a new organizational risk"
        sections={formSections}
        values={formValues}
        errors={errors}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        autoSave={true}
      />
    </MainContentArea>
  );
};

// ========== CONTROL TESTING FORM ==========
export const ControlTestingForm: React.FC = () => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formSections: FormSectionConfig[] = [
    {
      id: 'control-info',
      title: 'Control Information',
      description: 'Basic information about the control being tested',
      fields: [
        {
          id: 'control-id',
          label: 'Control ID',
          type: 'text',
          required: true,
          placeholder: 'e.g., AC-001',
          width: 'half',
        },
        {
          id: 'control-name',
          label: 'Control Name',
          type: 'text',
          required: true,
          placeholder: 'e.g., Access Control Management',
          width: 'half',
        },
        {
          id: 'framework',
          label: 'Framework',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'soc2', label: 'SOC 2' },
            { value: 'iso27001', label: 'ISO 27001' },
            { value: 'nist', label: 'NIST CSF' },
            { value: 'gdpr', label: 'GDPR' },
          ],
        },
        {
          id: 'test-frequency',
          label: 'Test Frequency',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'semi-annual', label: 'Semi-Annual' },
            { value: 'annual', label: 'Annual' },
            { value: 'continuous', label: 'Continuous' },
          ],
        },
      ],
    },
    {
      id: 'test-details',
      title: 'Test Execution',
      description: 'Details about the control testing process',
      fields: [
        {
          id: 'test-date',
          label: 'Test Date',
          type: 'text',
          required: true,
          placeholder: 'YYYY-MM-DD',
          width: 'half',
        },
        {
          id: 'tester',
          label: 'Tester',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'internal', label: 'Internal Team' },
            { value: 'external', label: 'External Auditor' },
            { value: 'consultant', label: 'Consultant' },
          ],
        },
        {
          id: 'test-method',
          label: 'Test Method',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'inspection', label: 'Inspection' },
            { value: 'observation', label: 'Observation' },
            { value: 'inquiry', label: 'Inquiry' },
            { value: 'reperformance', label: 'Reperformance' },
          ],
        },
        {
          id: 'sample-size',
          label: 'Sample Size',
          type: 'text',
          placeholder: 'e.g., 25 items',
          width: 'half',
        },
        {
          id: 'test-procedures',
          label: 'Test Procedures',
          type: 'textarea',
          required: true,
          placeholder: 'Describe the testing procedures performed...',
          width: 'full',
        },
      ],
    },
    {
      id: 'results',
      title: 'Test Results',
      description: 'Document the results and findings',
      fields: [
        {
          id: 'test-result',
          label: 'Overall Result',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            {
              value: 'effective',
              label: 'Effective',
              description: 'Control is operating effectively',
            },
            { value: 'deficient', label: 'Deficient', description: 'Control has deficiencies' },
            { value: 'ineffective', label: 'Ineffective', description: 'Control is not effective' },
          ],
        },
        {
          id: 'exceptions',
          label: 'Exceptions Found',
          type: 'text',
          placeholder: 'Number of exceptions',
          width: 'half',
        },
        {
          id: 'findings',
          label: 'Detailed Findings',
          type: 'textarea',
          placeholder: 'Document specific findings, exceptions, and observations...',
          width: 'full',
        },
        {
          id: 'evidence',
          label: 'Supporting Evidence',
          type: 'file',
          helperText: 'Upload screenshots, documents, or other evidence',
          width: 'full',
        },
      ],
    },
  ];

  const handleFormChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (values: Record<string, any>) => {
    // console.log('Control Test submitted:', values);
  };

  return (
    <MainContentArea
      title="Control Testing"
      subtitle="Document control testing procedures and results"
      breadcrumbs={[
        { label: 'Controls', href: '/dashboard/controls' },
        { label: 'Testing', href: '/dashboard/controls/testing' },
        { label: 'New Test', current: true },
      ]}
      primaryAction={{
        label: 'Submit Test Results',
        onClick: () => console.log('Submit'),
        icon: FileCheck,
      }}
      maxWidth="2xl"
    >
      <NotionForm
        title="Control Testing Form"
        description="Document the testing of security and compliance controls"
        sections={formSections}
        values={formValues}
        errors={errors}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </MainContentArea>
  );
};

// ========== USER MANAGEMENT FORM ==========
export const UserManagementForm: React.FC = () => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formSections: FormSectionConfig[] = [
    {
      id: 'user-info',
      title: 'User Information',
      description: 'Basic user account details',
      fields: [
        {
          id: 'first-name',
          label: 'First Name',
          type: 'text',
          required: true,
          width: 'half',
        },
        {
          id: 'last-name',
          label: 'Last Name',
          type: 'text',
          required: true,
          width: 'half',
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          width: 'half',
        },
        {
          id: 'department',
          label: 'Department',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'security', label: 'Security' },
            { value: 'compliance', label: 'Compliance' },
            { value: 'risk', label: 'Risk Management' },
            { value: 'audit', label: 'Internal Audit' },
            { value: 'legal', label: 'Legal' },
            { value: 'it', label: 'Information Technology' },
          ],
        },
      ],
    },
    {
      id: 'access-control',
      title: 'Access Control',
      description: 'Define user roles and permissions',
      fields: [
        {
          id: 'primary-role',
          label: 'Primary Role',
          type: 'select',
          required: true,
          width: 'half',
          options: [
            { value: 'admin', label: 'Administrator', description: 'Full system access' },
            { value: 'manager', label: 'Manager', description: 'Department management access' },
            {
              value: 'analyst',
              label: 'Analyst',
              description: 'Read/write access to assigned areas',
            },
            { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
          ],
        },
        {
          id: 'additional-roles',
          label: 'Additional Roles',
          type: 'select',
          width: 'half',
          helperText: 'Optional secondary roles',
          options: [
            { value: 'auditor', label: 'Auditor' },
            { value: 'approver', label: 'Approver' },
            { value: 'reviewer', label: 'Reviewer' },
          ],
        },
        {
          id: 'mfa-required',
          label: 'Multi-Factor Authentication',
          type: 'toggle',
          helperText: 'Require MFA for this user account',
          width: 'half',
        },
        {
          id: 'session-timeout',
          label: 'Session Timeout',
          type: 'select',
          width: 'half',
          options: [
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
            { value: '240', label: '4 hours' },
            { value: '480', label: '8 hours' },
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      description: 'Configure how the user receives notifications',
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          id: 'email-notifications',
          label: 'Email Notifications',
          type: 'toggle',
          helperText: 'Send notifications via email',
          width: 'half',
        },
        {
          id: 'slack-notifications',
          label: 'Slack Notifications',
          type: 'toggle',
          helperText: 'Send notifications via Slack',
          width: 'half',
        },
        {
          id: 'notification-frequency',
          label: 'Notification Frequency',
          type: 'select',
          width: 'half',
          options: [
            { value: 'immediate', label: 'Immediate' },
            { value: 'daily', label: 'Daily Digest' },
            { value: 'weekly', label: 'Weekly Summary' },
          ],
        },
      ],
    },
  ];

  const handleFormChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (values: Record<string, any>) => {
    // console.log('User created:', values);
  };

  return (
    <MainContentArea
      title="User Management"
      subtitle="Create and manage user accounts and permissions"
      breadcrumbs={[
        { label: 'Administration', href: '/dashboard/admin' },
        { label: 'Users', href: '/dashboard/admin/users' },
        { label: 'New User', current: true },
      ]}
      primaryAction={{
        label: 'Create User',
        onClick: () => console.log('Create'),
        icon: UserPlus,
      }}
      maxWidth="2xl"
    >
      <NotionForm
        title="Create New User"
        description="Add a new user to the system with appropriate roles and permissions"
        sections={formSections}
        values={formValues}
        errors={errors}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </MainContentArea>
  );
};

// ========== SETTINGS FORM ==========
export const SettingsForm: React.FC = () => {
  const [formValues, setFormValues] = useState<Record<string, any>>({
    'dark-mode': false,
    'auto-save': true,
    'email-notifications': true,
    'slack-integration': false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formSections: FormSectionConfig[] = [
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of your workspace',
      fields: [
        {
          id: 'theme',
          label: 'Theme',
          type: 'select',
          width: 'half',
          options: [
            { value: 'light', label: 'Light', description: 'Clean and bright interface' },
            { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
            { value: 'auto', label: 'Auto', description: 'Follow system preference' },
          ],
        },
        {
          id: 'density',
          label: 'Interface Density',
          type: 'select',
          width: 'half',
          options: [
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ],
        },
        {
          id: 'sidebar-collapsed',
          label: 'Collapse Sidebar by Default',
          type: 'toggle',
          helperText: 'Start with a collapsed sidebar for more screen space',
          width: 'full',
        },
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior',
      description: 'Configure how the application behaves',
      fields: [
        {
          id: 'auto-save',
          label: 'Auto-save',
          type: 'toggle',
          helperText: 'Automatically save changes as you work',
          width: 'half',
        },
        {
          id: 'confirm-destructive',
          label: 'Confirm Destructive Actions',
          type: 'toggle',
          helperText: 'Show confirmation dialogs for delete operations',
          width: 'half',
        },
        {
          id: 'default-page',
          label: 'Default Page',
          type: 'select',
          width: 'half',
          options: [
            { value: 'dashboard', label: 'Dashboard' },
            { value: 'risks', label: 'Risk Register' },
            { value: 'controls', label: 'Controls' },
            { value: 'compliance', label: 'Compliance' },
          ],
        },
        {
          id: 'items-per-page',
          label: 'Items per Page',
          type: 'select',
          width: 'half',
          options: [
            { value: '10', label: '10 items' },
            { value: '25', label: '25 items' },
            { value: '50', label: '50 items' },
            { value: '100', label: '100 items' },
          ],
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect with external tools and services',
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          id: 'slack-integration',
          label: 'Slack Integration',
          type: 'toggle',
          helperText: 'Receive notifications in Slack',
          width: 'half',
        },
        {
          id: 'teams-integration',
          label: 'Microsoft Teams',
          type: 'toggle',
          helperText: 'Connect with Microsoft Teams',
          width: 'half',
        },
        {
          id: 'jira-integration',
          label: 'Jira Integration',
          type: 'toggle',
          helperText: 'Sync with Jira for issue tracking',
          width: 'half',
        },
        {
          id: 'api-access',
          label: 'API Access',
          type: 'toggle',
          helperText: 'Enable programmatic access via API',
          width: 'half',
        },
      ],
    },
  ];

  const handleFormChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (values: Record<string, any>) => {
    // console.log('Settings saved:', values);
  };

  return (
    <MainContentArea
      title="Settings"
      subtitle="Configure your workspace preferences and integrations"
      breadcrumbs={[{ label: 'Settings', current: true }]}
      primaryAction={{
        label: 'Save Settings',
        onClick: () => console.log('Save'),
        icon: Save,
      }}
      maxWidth="2xl"
    >
      <NotionForm
        title="Workspace Settings"
        description="Customize your experience and configure integrations"
        sections={formSections}
        values={formValues}
        errors={errors}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        autoSave={true}
      />
    </MainContentArea>
  );
};

export default {
  RiskAssessmentForm,
  ControlTestingForm,
  UserManagementForm,
  SettingsForm,
};
