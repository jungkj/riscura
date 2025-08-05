'use client';

import React, { useState, useEffect } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
// import {
  ActionIcons,
  StatusIcons,
  DataIcons,
  FileIcons,
  UserIcons,
  RiskManagementIcons,
} from '@/components/icons/IconLibrary';
import { LoadingStates, Spinner } from '@/components/states/LoadingState';

// Bulk action types and interfaces
interface BulkAction {
  id: string
  label: string;
  icon: React.ComponentType<any>;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  disabled?: boolean;
  tooltip?: string;
  minSelection?: number;
  maxSelection?: number;
}

interface BulkActionResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors?: Array<{ id: string; error: string }>;
  message?: string;
}

interface BulkActionProgress {
  total: number;
  completed: number;
  current?: string;
  errors: Array<{ id: string; error: string }>;
}

interface BulkActionBarProps<T = any> {
  selectedItems: T[];
  totalItems: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (actionId: string, items: T[]) => Promise<BulkActionResult>;
  actions: BulkAction[];
  itemName?: string; // e.g., "risk", "user", "document"
  itemNamePlural?: string; // e.g., "risks", "users", "documents"
  showSelectAll?: boolean;
  showItemCount?: boolean;
  position?: 'top' | 'bottom' | 'floating';
  className?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  action: BulkAction;
  itemCount: number;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  action,
  itemCount,
  itemName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getActionColorClasses = (color: string) => {
    switch (color) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              action.color === 'danger'
                ? 'bg-red-100'
                : action.color === 'warning'
                  ? 'bg-yellow-100'
                  : action.color === 'success'
                    ? 'bg-green-100'
                    : 'bg-blue-100'
            }`}
          >
            <action.icon size="md" color={action.color} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Confirm {action.label}</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {action.confirmationMessage ||
            `Are you sure you want to ${action.label.toLowerCase()} ${itemCount} ${itemCount === 1 ? itemName : itemName + 's'}? This action cannot be undone.`}
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:ring-2 focus:ring-offset-2 transition-colors ${getActionColorClasses(action.color)}`}
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProgressModalProps {
  isOpen: boolean;
  progress: BulkActionProgress;
  action: BulkAction;
  onCancel?: () => void;
  onClose: () => void;
}

const ProgressModal: React.FC<DaisyProgressModalProps />= ({
  isOpen,
  progress,
  action,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const progressPercentage = (progress.completed / progress.total) * 100;
  const isComplete = progress.completed >= progress.total;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {isComplete ? (
              <StatusIcons.CheckCircle size="md" color="success" />
            ) : (
              <Spinner size="md" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isComplete ? 'Action Complete' : `${action.label} in Progress`}
          </h2>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>
              {progress.completed} of {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        {progress.current && !isComplete && (
          <p className="text-sm text-gray-600 mb-4">Processing: {progress.current}</p>
        )}

        {progress.errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <StatusIcons.AlertCircle size="xs" color="error" />
              <span className="text-sm font-medium text-red-800">
                {progress.errors.length} Error{progress.errors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="max-h-20 overflow-y-auto">
              {progress.errors.slice(0, 3).map((error, index) => (
                <p key={index} className="text-xs text-red-700">
                  {error.id}: {error.error}
                </p>
              ))}
              {progress.errors.length > 3 && (
                <p className="text-xs text-red-700">... and {progress.errors.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {!isComplete && onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          {Boolean(isComplete) && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BulkActionBar<T = any>({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  actions,
  itemName = 'item',
  itemNamePlural = 'items',
  showSelectAll = true,
  showItemCount = true,
  position = 'top',
  className = '',
}: BulkActionBarProps<T>) {
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: BulkAction | null;
  }>({ isOpen: false, action: null });

  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    progress: BulkActionProgress | null;
    action: BulkAction | null;
  }>({ isOpen: false, progress: null, action: null });

  const [isExecuting, setIsExecuting] = useState(false);

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;

  // Handle bulk action execution
  const executeBulkAction = async (_action: BulkAction) => {
    if (isExecuting) return

    // Check selection constraints
    if (action.minSelection && selectedCount < action.minSelection) {
      alert(
        `Please select at least ${action.minSelection} ${action.minSelection === 1 ? itemName : itemNamePlural}`
      )
      return;
    }

    if (action.maxSelection && selectedCount > action.maxSelection) {
      alert(
        `Please select no more than ${action.maxSelection} ${action.maxSelection === 1 ? itemName : itemNamePlural}`
      );
      return;
    }

    if (action.requiresConfirmation) {
      setConfirmationModal({ isOpen: true, action });
      return;
    }

    await performBulkAction(action);
  }

  const performBulkAction = async (_action: BulkAction) => {
    setIsExecuting(true);
    setConfirmationModal({ isOpen: false, action: null });

    // Initialize progress tracking
    const initialProgress: BulkActionProgress = {
      total: selectedCount,
      completed: 0,
      errors: [],
    }

    setProgressModal({
      isOpen: true,
      progress: initialProgress,
      action,
    });

    try {
      // For demonstration, we'll simulate progress updates
      // In a real implementation, you'd integrate with your actual bulk operation
      const _result = await onBulkAction(action.id, selectedItems)

      // Update progress to completion
      setProgressModal((prev) => ({
        ...prev,
        progress: {
          total: selectedCount,
          completed: selectedCount,
          errors: result.errors || [],
        },
      }))

      // Clear selection if action was successful
      if (result.success && result.errorCount === 0) {
        setTimeout(() => {
          onClearSelection()
        }, 2000);
      }
    } catch (error) {
      setProgressModal((prev) => ({
        ...prev,
        progress: {
          total: selectedCount,
          completed: selectedCount,
          errors: [
            { id: 'general', error: error instanceof Error ? error.message : 'Unknown error' },
          ],
        },
      }));
    } finally {
      setIsExecuting(false);
    }
  }

  const getActionButtonClasses = (_action: BulkAction) => {
    const baseClasses =
      'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    switch (action.color) {
      case 'danger':
        return `${baseClasses} text-red-700 bg-red-100 hover:bg-red-200 focus:ring-2 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-500`;
      case 'success':
        return `${baseClasses} text-green-700 bg-green-100 hover:bg-green-200 focus:ring-2 focus:ring-green-500`;
      case 'secondary':
        return `${baseClasses} text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500`;
      default:
        return `${baseClasses} text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500`;
    }
  }

  const positionClasses = {
    top: 'mb-4',
    bottom: 'mt-4',
    floating: 'fixed bottom-4 left-1/2 transform -translate-x-1/2 shadow-lg z-40',
  }

  if (selectedCount === 0 && position !== 'floating') return null;

  return (
    <>
      <div
        className={`bg-white border border-gray-200 rounded-lg p-4 ${positionClasses[position]} ${className}`}
      >
        <div className="flex items-center justify-between">
          {/* Selection Info */}
          <div className="flex items-center space-x-4">
            {Boolean(showSelectAll) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={isAllSelected ? onClearSelection : onSelectAll}
                  className="relative"
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={() => {}} // Controlled by button click
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                </button>
                <span className="text-sm text-gray-700">
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </span>
              </div>
            )}

            {Boolean(showItemCount) && (
              <div className="flex items-center space-x-2">
                <DataIcons.Database size="xs" color="secondary" />
                <span className="text-sm font-medium text-gray-900">
                  {selectedCount} of {totalItems} {selectedCount === 1 ? itemName : itemNamePlural}{' '}
                  selected
                </span>
              </div>
            )}

            {selectedCount > 0 && (
              <button
                onClick={onClearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              {actions.map((action) => {
                const isDisabled =
                  action.disabled ||
                  (action.minSelection && selectedCount < action.minSelection) ||
                  (action.maxSelection && selectedCount > action.maxSelection) ||
                  isExecuting;

                return (
                  <button
                    key={action.id}
                    onClick={() => executeBulkAction(action)}
                    disabled={isDisabled}
                    title={action.tooltip}
                    className={getActionButtonClasses(action)}
                  >
                    <action.icon size="xs" className="mr-2" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        action={confirmationModal.action!}
        itemCount={selectedCount}
        itemName={itemName}
        onConfirm={() => confirmationModal.action && performBulkAction(confirmationModal.action)}
        onCancel={() => setConfirmationModal({ isOpen: false, action: null })} />

      {/* Progress Modal */}
      <DaisyProgressModal
        isOpen={progressModal.isOpen}
        progress={progressModal.progress!}
        action={progressModal.action!}
        onClose={() =>setProgressModal({ isOpen: false, progress: null, action: null })} />
    </>
  );
}

// Predefined bulk actions for common use cases
export const commonBulkActions = {
  // Risk Management Actions
  riskActions: [
    {
      id: 'approve',
      label: 'Approve',
      icon: StatusIcons.CheckCircle,
      color: 'success' as const,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to approve the selected risks?',
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: StatusIcons.XCircle,
      color: 'danger' as const,
      requiresConfirmation: true,
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: FileIcons.Archive,
      color: 'secondary' as const,
      requiresConfirmation: true,
    },
    {
      id: 'export',
      label: 'Export',
      icon: ActionIcons.Download,
      color: 'primary' as const,
      requiresConfirmation: false,
    },
    {
      id: 'assign',
      label: 'Assign Owner',
      icon: UserIcons.Users,
      color: 'primary' as const,
      requiresConfirmation: false,
    },
  ],

  // User Management Actions
  userActions: [
    {
      id: 'activate',
      label: 'Activate',
      icon: StatusIcons.CheckCircle,
      color: 'success' as const,
      requiresConfirmation: true,
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: StatusIcons.XCircle,
      color: 'warning' as const,
      requiresConfirmation: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: ActionIcons.Trash,
      color: 'danger' as const,
      requiresConfirmation: true,
      confirmationMessage:
        'Are you sure you want to permanently delete the selected users? This action cannot be undone.',
    },
    {
      id: 'export',
      label: 'Export',
      icon: ActionIcons.Download,
      color: 'primary' as const,
      requiresConfirmation: false,
    },
  ],

  // Document Actions
  documentActions: [
    {
      id: 'download',
      label: 'Download',
      icon: ActionIcons.Download,
      color: 'primary' as const,
      requiresConfirmation: false,
      maxSelection: 10,
      tooltip: 'Download up to 10 documents at once',
    },
    {
      id: 'move',
      label: 'Move to Folder',
      icon: FileIcons.Folder,
      color: 'secondary' as const,
      requiresConfirmation: false,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: ActionIcons.Trash,
      color: 'danger' as const,
      requiresConfirmation: true,
    },
  ],
}

export default BulkActionBar;
