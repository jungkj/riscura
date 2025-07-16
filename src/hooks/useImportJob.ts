import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface ImportJob {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  progressMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: any;
  importedBy?: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface UseImportJobReturn {
  job: ImportJob | null;
  isLoading: boolean;
  error: string | null;
  cancelJob: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useImportJob = (jobId: string, pollInterval: number = 2000): UseImportJobReturn => {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Fetch job status
  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;
    
    try {
      const response = await api.get(`/api/import/jobs/${jobId}`);
      const data = await response.json();
      
      if (data.job) {
        const jobData: ImportJob = {
          ...data.job,
          startedAt: new Date(data.job.startedAt),
          completedAt: data.job.completedAt ? new Date(data.job.completedAt) : undefined
        };
        
        setJob(jobData);
        setError(null);
        
        // Stop polling if job is in terminal state
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(jobData.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
        }
      } else if (data.error) {
        setError(data.error);
        setJob(null);
        
        // Stop polling on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      }
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError('Failed to fetch import job status');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Cancel job
  const cancelJob = useCallback(async (): Promise<boolean> => {
    if (!jobId) return false;
    
    try {
      setError(null);
      
      const response = await api.delete(`/api/import/jobs/${jobId}`);
      const data = await response.json();
      
      if (data.message) {
        // Update local state
        setJob(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
        
        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
        
        return true;
      } else if (data.error) {
        setError(data.error);
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('Error cancelling job:', err);
      setError('Failed to cancel import job');
      return false;
    }
  }, [jobId]);

  // Refresh job status
  const refresh = useCallback(async () => {
    await fetchJobStatus();
  }, [fetchJobStatus]);

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchJobStatus();
    
    // Set up polling interval
    intervalRef.current = setInterval(fetchJobStatus, pollInterval);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId, fetchJobStatus, pollInterval]);

  return {
    job,
    isLoading,
    error,
    cancelJob,
    refresh
  };
};

// Hook for managing multiple import jobs
interface UseImportJobsReturn {
  jobs: ImportJob[];
  isLoading: boolean;
  error: string | null;
  total: number;
  createImportJob: (params: {
    integrationId: string;
    fileId: string;
    fileName: string;
  }) => Promise<{ success: boolean; jobId?: string; error?: string }>;
  fetchJobs: (integrationId?: string, limit?: number, offset?: number) => Promise<void>;
}

export const useImportJobs = (): UseImportJobsReturn => {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Create import job
  const createImportJob = useCallback(async (params: {
    integrationId: string;
    fileId: string;
    fileName: string;
  }): Promise<{ success: boolean; jobId?: string; error?: string }> => {
    try {
      setError(null);
      
      const response = await api.post('/api/sharepoint/import', params);
      const data = await response.json();
      
      if (data.jobId) {
        return { success: true, jobId: data.jobId };
      } else if (data.error) {
        setError(data.error);
        return { success: false, error: data.error, jobId: data.jobId };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (err) {
      console.error('Error creating import job:', err);
      const errorMessage = 'Failed to create import job';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(async (
    integrationId?: string, 
    limit: number = 10, 
    offset: number = 0
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (integrationId) {
        params.append('integrationId', integrationId);
      }
      
      const response = await api.get(`/api/sharepoint/import?${params}`);
      const data = await response.json();
      
      if (data.jobs) {
        setJobs(data.jobs.map((job: any) => ({
          ...job,
          startedAt: new Date(job.startedAt),
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined
        })));
        setTotal(data.total || 0);
      } else if (data.error) {
        setError(data.error);
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching import jobs:', err);
      setError('Failed to load import history');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    jobs,
    isLoading,
    error,
    total,
    createImportJob,
    fetchJobs
  };
};