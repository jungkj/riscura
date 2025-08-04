'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import { StatusIcons, ActionIcons, TimeIcons, DataIcons } from '@/components/icons/IconLibrary';
import { LoadingStates } from '@/components/states/LoadingState';
import { RotateCcw } from 'lucide-react';

// Auto-save types and interfaces
interface AutoSaveConfig {
  enabled: boolean
  interval: number; // milliseconds
  debounceDelay: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  lastSaved?: Date;
  lastModified?: Date;
  error?: string;
  retryCount?: number;
  hasUnsavedChanges: boolean;
}

interface ConflictResolution {
  serverVersion: any;
  localVersion: any;
  conflictFields: string[];
  onResolve: (_resolution: 'server' | 'local' | 'merge', mergedData?: any) => void;
}

interface AutoSaveFormProps<T = any> {
  initialData: T;
  onSave: (_data: T) => Promise<{
    success: boolean;
    data?: T;
    error?: string;
    conflict?: boolean;
    serverVersion?: T;
  }>;
  onDataChange?: (_data: T) => void;
  config?: Partial<AutoSaveConfig>;
  children: (props: {
    data: T;
    updateData: (updates: Partial<T>) => void;
    setFieldValue: (field: keyof T, value: any) => void;
    autoSaveStatus: AutoSaveStatus;
    manualSave: () => Promise<void>;
    resetForm: () => void;
    hasUnsavedChanges: boolean;
  }) => React.ReactNode;
  className?: string;
}

const defaultConfig: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  debounceDelay: 2000, // 2 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
}

export function AutoSaveForm<T = any>({
  initialData,
  onSave,
  onDataChange,
  config = {},
  children,
  className = '',
}: AutoSaveFormProps<T>) {
  const finalConfig = { ...defaultConfig, ...config }

  const [data, setData] = useState<T>(initialData);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: 'idle',
    hasUnsavedChanges: false,
  });
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<T>(initialData);
  const saveInProgressRef = useRef(false);

  // Update data and trigger change detection
  const updateData = useCallback(
    (updates: Partial<T>) => {
      setData((prevData) => {
        const newData = { ...prevData, ...updates }

        // Check if data actually changed
        const hasChanges = JSON.stringify(newData) !== JSON.stringify(lastSavedDataRef.current)

        setAutoSaveStatus((prev) => ({
          ...prev,
          hasUnsavedChanges: hasChanges,
          lastModified: hasChanges ? new Date() : prev.lastModified,
          status: hasChanges && prev.status === 'saved' ? 'idle' : prev.status,
        }));

        if (onDataChange) {
          onDataChange(newData);
        }

        return newData;
      });
    },
    [onDataChange]
  );

  // Set individual field value
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      updateData({ [field]: value } as Partial<T>)
    },
    [updateData]
  );

  // Perform auto-save
  const performSave = useCallback(
    async (isManual = false): Promise<void> => {
      if (saveInProgressRef.current) return

      const currentData = data;
      const hasChanges = JSON.stringify(currentData) !== JSON.stringify(lastSavedDataRef.current);

      if (!hasChanges && !isManual) return;

      saveInProgressRef.current = true;
      setAutoSaveStatus((prev) => ({ ...prev, status: 'saving' }));

      try {
        const _result = await onSave(currentData);

        if (result.success) {
          lastSavedDataRef.current = result.data || currentData;
          setAutoSaveStatus((prev) => ({
            ...prev,
            status: 'saved',
            lastSaved: new Date(),
            hasUnsavedChanges: false,
            error: undefined,
            retryCount: 0,
          }));

          // Update data with server response if provided
          if (result.data && JSON.stringify(result.data) !== JSON.stringify(currentData)) {
            setData(result.data)
          }
        } else if (result.conflict && result.serverVersion) {
          // Handle conflict
          const conflictFields = findConflictFields(currentData, result.serverVersion)
          setConflictResolution({
            serverVersion: result.serverVersion,
            localVersion: currentData,
            conflictFields,
            onResolve: handleConflictResolution,
          });
          setAutoSaveStatus((prev) => ({ ...prev, status: 'conflict' }));
        } else {
          throw new Error(result.error || 'Save failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Save failed';
        const currentRetryCount = autoSaveStatus.retryCount || 0;

        if (currentRetryCount < finalConfig.maxRetries && !isManual) {
          // Schedule retry
          setAutoSaveStatus((prev) => ({
            ...prev,
            status: 'error',
            error: errorMessage,
            retryCount: currentRetryCount + 1,
          }))

          retryTimeoutRef.current = setTimeout(() => {
            performSave(false);
          }, finalConfig.retryDelay);
        } else {
          setAutoSaveStatus((prev) => ({
            ...prev,
            status: 'error',
            error: errorMessage,
            retryCount: currentRetryCount + 1,
          }));
        }
      } finally {
        saveInProgressRef.current = false;
      }
    },
    [data, autoSaveStatus.retryCount, finalConfig.maxRetries, finalConfig.retryDelay, onSave]
  );

  // Find conflicting fields between local and server versions
  const findConflictFields = (local: T, server: T): string[] => {
    const conflicts: string[] = []
    const localStr = JSON.stringify(local);
    const serverStr = JSON.stringify(server);

    if (localStr !== serverStr) {
      // Simple implementation - in real app, you'd do field-by-field comparison
      Object.keys(local as any).forEach((key) => {
        if (JSON.stringify((local as any)[key]) !== JSON.stringify((server as any)[key])) {
          conflicts.push(key)
        }
      });
    }

    return conflicts;
  }

  // Handle conflict resolution
  const handleConflictResolution = useCallback(
    (_resolution: 'server' | 'local' | 'merge', mergedData?: T) => {
      if (resolution === 'server' && conflictResolution) {
        setData(conflictResolution.serverVersion)
        lastSavedDataRef.current = conflictResolution.serverVersion;
      } else if (resolution === 'merge' && mergedData) {
        setData(mergedData);
        performSave(true); // Save the merged version
      } else if (resolution === 'local') {
        performSave(true); // Force save local version
      }

      setConflictResolution(null);
      setAutoSaveStatus((prev) => ({ ...prev, status: 'saved' }));
    },
    [conflictResolution, performSave]
  );

  // Manual save function
  const manualSave = useCallback(async () => {
    await performSave(true)
  }, [performSave]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setData(initialData)
    lastSavedDataRef.current = initialData;
    setAutoSaveStatus({
      status: 'idle',
      hasUnsavedChanges: false,
    });
    setConflictResolution(null);
  }, [initialData]);

  // Set up debounced auto-save on data changes
  useEffect(() => {
    if (!finalConfig.enabled || !autoSaveStatus.hasUnsavedChanges) return

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new debounced save
    debounceTimeoutRef.current = setTimeout(() => {
      performSave(false)
    }, finalConfig.debounceDelay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  }, [
    data,
    finalConfig.enabled,
    finalConfig.debounceDelay,
    autoSaveStatus.hasUnsavedChanges,
    performSave,
  ]);

  // Set up periodic auto-save
  useEffect(() => {
    if (!finalConfig.enabled) return

    intervalRef.current = setInterval(() => {
      if (autoSaveStatus.hasUnsavedChanges && autoSaveStatus.status !== 'saving') {
        performSave(false);
      }
    }, finalConfig.interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [
    finalConfig.enabled,
    finalConfig.interval,
    autoSaveStatus.hasUnsavedChanges,
    autoSaveStatus.status,
    performSave,
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autoSaveStatus.hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '';
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveStatus.hasUnsavedChanges]);

  return (
    <div className={`relative ${className}`}>
      {/* Auto-save Status Indicator */}
      {finalConfig.enabled && (
        <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-2">
            {autoSaveStatus.status === 'saving' && (
              <>
                <DataIcons.Activity size="xs" color="secondary" />
                <span className="text-sm text-gray-600">Saving...</span>
              </>
            )}

            {autoSaveStatus.status === 'saved' && autoSaveStatus.lastSaved && (
              <>
                <StatusIcons.CheckCircle size="xs" color="success" />
                <span className="text-sm text-green-600">
                  Saved at {autoSaveStatus.lastSaved.toLocaleTimeString()}
                </span>
              </>
            )}

            {autoSaveStatus.status === 'error' && (
              <>
                <StatusIcons.AlertCircle size="xs" color="error" />
                <span className="text-sm text-red-600">
                  Save failed: {autoSaveStatus.error}
                  {(autoSaveStatus.retryCount || 0) < finalConfig.maxRetries && (
                    <span className="ml-1">(retrying...)</span>
                  )}
                </span>
              </>
            )}

            {autoSaveStatus.status === 'conflict' && (
              <>
                <StatusIcons.AlertTriangle size="xs" color="warning" />
                <span className="text-sm text-yellow-600">Conflict detected - please resolve</span>
              </>
            )}

            {autoSaveStatus.hasUnsavedChanges && autoSaveStatus.status === 'idle' && (
              <>
                <TimeIcons.Clock size="xs" color="secondary" />
                <span className="text-sm text-gray-600">
                  Unsaved changes
                  {autoSaveStatus.lastModified && (
                    <span className="ml-1">
                      (modified {autoSaveStatus.lastModified.toLocaleTimeString()})
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={manualSave}
              disabled={autoSaveStatus.status === 'saving' || !autoSaveStatus.hasUnsavedChanges}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ActionIcons.Save size="xs" className="mr-1" />
              Save Now
            </button>

            {autoSaveStatus.hasUnsavedChanges && (
              <button
                onClick={resetForm}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {Boolean(conflictResolution) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <StatusIcons.AlertTriangle size="md" color="warning" />
              <h2 className="text-lg font-semibold text-gray-900">Conflict Detected</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              The data has been modified by another user. Please choose how to resolve the conflict:
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-3 border border-gray-200 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Conflicting Fields:</h3>
                <div className="flex flex-wrap gap-2">
                  {conflictResolution.conflictFields.map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => conflictResolution.onResolve('server')}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Use Server Version
              </button>
              <button
                onClick={() => conflictResolution.onResolve('local')}
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
              >
                Keep My Changes
              </button>
              <button
                onClick={() => {
                  // Simple merge strategy - in real app, you'd provide a merge interface
                  const merged = {
                    ...conflictResolution.serverVersion,
                    ...conflictResolution.localVersion,
                  }
                  conflictResolution.onResolve('merge', merged);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
              >
                Merge Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      {children({
        data,
        updateData,
        setFieldValue,
        autoSaveStatus,
        manualSave,
        resetForm,
        hasUnsavedChanges: autoSaveStatus.hasUnsavedChanges,
      })}
    </div>
  );
}

// Higher-order component for easier integration
export function withAutoSave<T = any>(
  WrappedComponent: React.ComponentType<any>,
  saveFunction: (_data: T) => Promise<{
    success: boolean
    data?: T;
    error?: string;
    conflict?: boolean;
    serverVersion?: T;
  }>,
  config?: Partial<AutoSaveConfig>
) {
  return function AutoSaveWrapper(props: any) {
    return (
      <AutoSaveForm
        initialData={props.initialData || {}}
        onSave={saveFunction}
        config={config}
        onDataChange={props.onDataChange}
      >
        {({
          data,
          updateData,
          setFieldValue,
          autoSaveStatus,
          manualSave,
          resetForm,
          hasUnsavedChanges,
        }) => (
          <WrappedComponent
            {...props}
            data={data}
            updateData={updateData}
            setFieldValue={setFieldValue}
            autoSaveStatus={autoSaveStatus}
            manualSave={manualSave}
            resetForm={resetForm}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}
      </AutoSaveForm>
    );
  }
}

export default AutoSaveForm;
