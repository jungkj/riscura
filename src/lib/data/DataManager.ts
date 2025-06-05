import { localStorageService } from '../storage/LocalStorageService';
import { autoSaveService, AutoSaveData } from './AutoSaveService';
import { validationService, ValidationError } from '../validation/ValidationService';
import { offlineManager } from '../offline/OfflineManager';

export interface DataManagerConfig {
  enableAutoSave: boolean;
  enableOfflineMode: boolean;
  enableValidation: boolean;
  autoSaveInterval: number;
  maxRetries: number;
  compressionEnabled: boolean;
}

export interface DataOperation<T = any> {
  type: 'create' | 'update' | 'delete' | 'read';
  resource: string;
  id: string;
  data?: T;
  options?: {
    immediate?: boolean;
    skipValidation?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    offline?: boolean;
  };
}

export interface DataResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata?: {
    cached: boolean;
    fromDraft: boolean;
    version: number;
    lastModified: Date;
    syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
  };
}

export class DataManager {
  // Implementation coming soon
}

// Export singleton instance
export const dataManager = DataManager.getInstance(); 