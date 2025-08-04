'use client';

import React, { useEffect, useState } from 'react';
import { useImportJob } from '@/hooks/useImportJob';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
// import { DaisyCard } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Eye,
  X
} from 'lucide-react';

interface Props {
  jobId: string;
  onComplete: (success: boolean) => void;
  onCancel?: () => void;
}

export const ImportProgress: React.FC<Props> = ({ jobId, onComplete, onCancel }) => {
  const { job, isLoading, error, cancelJob } = useImportJob(jobId);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (job && (job.status === 'COMPLETED' || job.status === 'FAILED')) {
      onComplete(job.status === 'COMPLETED');
    }
  }, [job?.status, onComplete]);

  const handleCancel = async () => {
    setCancelling(true);
    const success = await cancelJob();
    if (success) {
      onCancel?.();
    }
    setCancelling(false);
  };

  if (isLoading && !job) {
    return (
      <DaisyCard className="p-6" >
  <div className="flex items-center justify-center">
</DaisyCard>
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2">Loading import status...</span>
        </div>
      </DaisyCard>
    );
  }

  if (error) {
    return (
      <DaisyAlert variant="error" >
  {error}
</DaisyAlert>
      </DaisyAlert>
    );
  }

  if (!job) {
    return (
      <DaisyAlert variant="error" >
  Import job not found
</DaisyAlert>
      </DaisyAlert>
    );
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'COMPLETED':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'CANCELLED':
        return <XCircle className="h-6 w-6 text-gray-500" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'COMPLETED':
        return 'text-green-700 bg-green-50';
      case 'FAILED':
        return 'text-red-700 bg-red-50';
      case 'CANCELLED':
        return 'text-gray-700 bg-gray-50';
      default:
        return 'text-blue-700 bg-blue-50';
    }
  };

  const formatImportResults = () => {
    if (!job.metadata?.importResult) return null;
    
    const { risksImported, controlsImported, assessmentsImported } = job.metadata.importResult;
    return (
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{risksImported || 0}</p>
          <p className="text-sm text-gray-600">Risks Imported</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{controlsImported || 0}</p>
          <p className="text-sm text-gray-600">Controls Imported</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{assessmentsImported || 0}</p>
          <p className="text-sm text-gray-600">Assessments Imported</p>
        </div>
      </div>
    );
  };

  return (
    <DaisyCard className="p-6" >
  <div className="space-y-4">
</DaisyCard>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold">
                {job.metadata?.fileName || 'Excel Import'}
              </h3>
              <p className={`text-sm px-2 py-1 rounded-full inline-block ${getStatusColor()}`}>
                {job.status.replace('_', ' ')}
              </p>
            </div>
          </div>
          {job.status === 'PROCESSING' && (
            <DaisyButton
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={cancelling}>
          {cancelling ? (

        </DaisyButton>
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Cancel
            </DaisyButton>
          )}
        </div>

        {/* Progress Bar */}
        {(job.status === 'QUEUED' || job.status === 'PROCESSING') && (
          <div className="space-y-2">
            <DaisyProgress value={job.progress} className="h-2" />
<p className="text-sm text-gray-600">
              {job.progressMessage || 'Processing...'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {job.status === 'FAILED' && job.errorMessage && (
          <DaisyAlert variant="error" >
  <DaisyAlertCircle className="h-4 w-4" />
</DaisyProgress>
            <span className="ml-2">{job.errorMessage}</span>
          </DaisyAlert>
        )}

        {/* Success Results */}
        {job.status === 'COMPLETED' && (
          <>
            <DaisyAlert variant="success" >
  <CheckCircle className="h-4 w-4" />
</DaisyAlert>
              <span className="ml-2">
                {job.progressMessage || 'Import completed successfully!'}
              </span>
            </DaisyAlert>
            {formatImportResults()}
          </>
        )}

        {/* Metadata */}
        <div className="border-t pt-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Started:</span>
            <span>{new Date(job.startedAt).toLocaleString()}</span>
          </div>
          {job.completedAt && (
            <div className="flex justify-between mt-1">
              <span>Completed:</span>
              <span>{new Date(job.completedAt).toLocaleString()}</span>
            </div>
          )}
          {job.importedBy && (
            <div className="flex justify-between mt-1">
              <span>Imported by:</span>
              <span>{job.importedBy.name || job.importedBy.email}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {job.status === 'COMPLETED' && (
          <div className="flex gap-2 pt-2">
            <DaisyButton
              onClick={() => router.push('/risks')}
              size="sm" />
              <Eye className="h-4 w-4 mr-2" />
              View Imported Data
            </DaisyButton>
          </div>
        )}
      </div>
    </DaisyCard>
  );
};