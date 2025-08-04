// SharePoint Integration Types
import { ValidationError } from '@/services/excel/validator.service';

export interface SharePointIntegration {
  id: string;
  organizationId: string;
  displayName: string;
  siteId: string;
  driveId?: string | null;
  isActive: boolean;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharePointSiteInfo {
  id: string;
  displayName: string;
  webUrl: string;
  description?: string;
}

export interface SharePointFileInfo {
  id: string;
  name: string;
  size: number;
  modifiedDate: Date;
  downloadUrl?: string;
  webUrl?: string;
  mimeType?: string;
  path?: string;
}

export interface ImportJob {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  status: ImportJobStatus;
  progress: number;
  progressMessage?: string | null;
  sourceUrl: string;
  metadata?: ImportJobMetadata;
  errorMessage?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

export enum ImportJobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ImportJobMetadata {
  fileName?: string;
  fileId?: string;
  integrationId?: string;
  importedBy?: string;
  fileSize?: number;
  sheets?: string[];
  rowCount?: number;
  riskCount?: number;
  controlCount?: number;
  assessmentCount?: number;
  importResult?: ImportResult;
  [key: string]: any;
}

export interface ImportResult {
  risksImported: number;
  controlsImported: number;
  assessmentsImported: number;
  errors: string[];
  warnings: string[];
}

export interface ExcelValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: {
    rowCount: number;
    fileSize: number;
    sheets: string[];
    riskCount?: number;
    controlCount?: number;
    assessmentCount?: number;
  };
}

// API Request/Response Types

export interface ConnectSharePointRequest {
  siteUrl: string;
}

export interface ConnectSharePointResponse {
  integration?: SharePointIntegration & { webUrl?: string };
  message?: string;
  error?: string;
}

export interface ListSharePointFilesRequest {
  integrationId: string;
  path?: string;
}

export interface ListSharePointFilesResponse {
  files?: SharePointFileInfo[];
  integration?: {
    id: string;
    displayName: string;
  };
  error?: string;
}

export interface SearchSharePointFilesRequest {
  integrationId: string;
  query: string;
  fileTypes?: string[];
}

export interface SearchSharePointFilesResponse {
  files?: SharePointFileInfo[];
  query?: string;
  resultCount?: number;
  error?: string;
}

export interface CreateImportJobRequest {
  integrationId: string;
  fileId: string;
  fileName: string;
}

export interface CreateImportJobResponse {
  jobId?: string;
  message?: string;
  status?: string;
  error?: string;
}

export interface GetImportJobResponse {
  job?: ImportJob & {
    importedBy?: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  };
  error?: string;
}

export interface ListImportJobsResponse {
  jobs?: Array<
    ImportJob & {
      importedBy?: {
        id: string;
        name?: string | null;
        email?: string | null;
      };
    }
  >;
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
}

// Hook Return Types

export interface UseSharePointIntegrationReturn {
  integrations: SharePointIntegration[];
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (siteUrl: string) => Promise<{
    success: boolean;
    integration?: SharePointIntegration;
    error?: string;
  }>;
  disconnect: (integrationId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export interface UseSharePointFilesReturn {
  files: SharePointFileInfo[];
  isLoading: boolean;
  error: string | null;
  currentPath: string;
  listFiles: (path?: string) => Promise<void>;
  searchFiles: (_query: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseImportJobReturn {
  job: ImportJob | null;
  isLoading: boolean;
  error: string | null;
  cancelJob: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export interface UseImportJobsReturn {
  jobs: ImportJob[];
  isLoading: boolean;
  error: string | null;
  total: number;
  createImportJob: (params: CreateImportJobRequest) => Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }>;
  fetchJobs: (integrationId?: string, limit?: number, offset?: number) => Promise<void>;
}

// Service Types

export interface SharePointAuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  certificateName?: string;
  keyVaultName?: string;
  scope?: string;
}

export interface GraphClientOptions {
  authProvider: any;
  defaultVersion?: string;
}
