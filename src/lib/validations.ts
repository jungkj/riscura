import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  role: z.enum(['admin', 'risk_manager', 'auditor', 'user']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

// Risk Management Schemas
export const riskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['operational', 'financial', 'strategic', 'compliance', 'technology']),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  owner: z.string().min(1, 'Owner is required'),
  status: z.enum(['identified', 'assessed', 'mitigated', 'closed']).optional(),
});

export const controlSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['preventive', 'detective', 'corrective']),
  effectiveness: z.enum(['high', 'medium', 'low']),
  owner: z.string().min(1, 'Owner is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  status: z.enum(['active', 'inactive', 'planned']).optional(),
});

// Document Schemas
export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string().min(1, 'Document type is required'),
  content: z.string().min(1, 'Document content is required'),
});

// Questionnaire Schemas
export const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['text', 'multiple_choice', 'rating', 'yes_no']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
});

export const questionnaireSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  targetRoles: z.array(z.string()).min(1, 'At least one target role is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});

// Workflow Schemas
export const workflowStepSchema = z.object({
  name: z.string().min(1, 'Step name is required'),
  type: z.enum(['approval', 'review', 'action']),
  assignee: z.string().min(1, 'Assignee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});

export const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().min(1, 'Description is required'),
  steps: z.array(workflowStepSchema).min(1, 'At least one step is required'),
  assignedTo: z.array(z.string()).min(1, 'At least one assignee is required'),
});

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type RiskFormData = z.infer<typeof riskSchema>;
export type ControlFormData = z.infer<typeof controlSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;
export type WorkflowFormData = z.infer<typeof workflowSchema>; 