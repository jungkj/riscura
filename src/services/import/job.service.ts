import Bull from 'bull';
import { ImportJob, ImportJobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getSharePointFileService } from '../sharepoint/file.service';
import { getExcelValidatorService } from '../excel/validator.service';
import { importRCSAData } from './rcsa-importer';

interface JobData {
  jobId: string;
  organizationId: string;
  userId: string;
  integrationId: string;
  siteId: string;
  driveId: string;
  fileId: string;
  fileName: string;
}

interface JobProgress {
  progress: number;
  message: string;
}

interface ImportJobUpdateData {
  status: ImportJobStatus;
  progress: number;
  progressMessage: string;
  metadata?: any;
  errorMessage?: string;
  completedAt?: Date;
}

export class ImportJobService {
  private queue: Bull.Queue<JobData>;
  private static instance: ImportJobService;

  constructor() {
    // Validate Redis configuration
    const redisConfig = this.validateRedisConfig();

    // Initialize Bull queue with Redis connection
    this.queue = new Bull<JobData>('import-jobs', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupWorkers();
    this.setupEventHandlers();
  }

  /**
   * Validate Redis configuration
   */
  private validateRedisConfig() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      // Parse Redis URL if provided
      try {
        const url = new URL(redisUrl);
        return {
          host: url.hostname,
          port: parseInt(url.port || '6379'),
          password: url.password || undefined,
          username: url.username || undefined,
          db: parseInt(url.pathname.slice(1) || '0'),
          tls: url.protocol === 'rediss:' ? {} : undefined,
        };
      } catch (error) {
        console.error('Invalid REDIS_URL format:', error);
        throw new Error('Invalid REDIS_URL configuration');
      }
    }

    // Fall back to individual Redis environment variables
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');

    // Validate port number
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('Invalid REDIS_PORT: must be a number between 1 and 65535');
    }

    return {
      host,
      port,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ImportJobService {
    if (!ImportJobService.instance) {
      ImportJobService.instance = new ImportJobService();
    }
    return ImportJobService.instance;
  }

  /**
   * Create a new import job
   */
  async createImportJob(params: {
    organizationId: string;
    userId: string;
    integrationId: string;
    siteId: string;
    driveId: string;
    fileId: string;
    fileName: string;
    sourceUrl: string;
    metadata?: any;
    importType?: string; // Allow custom import type
  }): Promise<string> {
    try {
      // Create job record in database
      const job = await prisma.importJob.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId,
          type: params.importType || 'sharepoint-excel-import', // Use provided type or default
          status: ImportJobStatus.QUEUED,
          sourceUrl: params.sourceUrl,
          metadata: params.metadata || {},
          progress: 0,
          progressMessage: 'Job queued for processing',
        },
      });

      // Add job to Bull queue
      const bullJob = await this.queue.add(
        {
          jobId: job.id,
          organizationId: params.organizationId,
          userId: params.userId,
          integrationId: params.integrationId,
          siteId: params.siteId,
          driveId: params.driveId,
          fileId: params.fileId,
          fileName: params.fileName,
        },
        {
          jobId: job.id, // Use same ID for Bull job
        }
      );

      return job.id;
    } catch (error) {
      console.error('Error creating import job:', error);
      throw new Error('Failed to create import job');
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ImportJob | null> {
    try {
      const job = await prisma.importJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return null;
      }

      // Get Bull job for additional details
      const bullJob = await this.queue.getJob(jobId);
      if (bullJob) {
        // Update progress from Bull job if available
        const progress = bullJob.progress();
        if (typeof progress === 'number' && progress !== job.progress) {
          // Use transaction to ensure atomic update with optimistic locking
          const updatedJob = await prisma.$transaction(async (tx) => {
            // Re-fetch the job within transaction to check current state
            const currentJob = await tx.importJob.findUnique({
              where: { id: jobId },
            });

            if (!currentJob) {
              throw new Error('Job not found');
            }

            // Only update if progress has actually changed
            if (currentJob.progress !== progress) {
              return await tx.importJob.update({
                where: { id: jobId },
                data: {
                  progress,
                  updatedAt: new Date(), // Explicit timestamp for version tracking
                },
              });
            }

            return currentJob;
          });

          job.progress = updatedJob.progress;
        }
      }

      return job;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new Error('Failed to get job status');
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // Update database
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportJobStatus.CANCELLED,
          completedAt: new Date(),
          progressMessage: 'Job cancelled by user',
        },
      });

      // Remove from Bull queue
      const bullJob = await this.queue.getJob(jobId);
      if (bullJob) {
        await bullJob.remove();
      }

      return true;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }

  /**
   * Setup job workers
   */
  private setupWorkers(): void {
    this.queue.process('*', async (job) => {
      const { data } = job;

      try {
        // Update job status to processing
        await this.updateJobStatus(
          data.jobId,
          ImportJobStatus.PROCESSING,
          0,
          'Starting import process'
        );

        // Step 1: Download file from SharePoint (20%)
        await job.progress(10);
        await this.updateProgress(data.jobId, 10, 'Connecting to SharePoint');

        const fileService = getSharePointFileService();
        const fileBuffer = await fileService.downloadFile(data.siteId, data.driveId, data.fileId);

        await job.progress(20);
        await this.updateProgress(data.jobId, 20, 'File downloaded successfully');

        // Step 2: Validate Excel file (40%)
        await job.progress(30);
        await this.updateProgress(data.jobId, 30, 'Validating Excel file structure');

        const validator = getExcelValidatorService();
        const validationResult = await validator.validateRCSAFile(fileBuffer);

        if (!validationResult.isValid) {
          throw new Error(
            `File validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`
          );
        }

        await job.progress(40);
        await this.updateProgress(data.jobId, 40, 'File validation completed');

        // Step 3: Import data (80%)
        await job.progress(50);
        await this.updateProgress(data.jobId, 50, 'Importing risk data');

        const importResult = await importRCSAData(fileBuffer, {
          organizationId: data.organizationId,
          userId: data.userId,
          fileName: data.fileName,
          onProgress: async (progress: number, message: string) => {
            const overallProgress = 50 + Math.floor(progress * 0.3); // 50-80%
            await job.progress(overallProgress);
            await this.updateProgress(data.jobId, overallProgress, message);
          },
        });

        await job.progress(80);
        await this.updateProgress(data.jobId, 80, 'Data import completed');

        // Step 4: Finalize (100%)
        await job.progress(90);
        await this.updateProgress(data.jobId, 90, 'Finalizing import');

        // Update job as completed
        await this.updateJobStatus(
          data.jobId,
          ImportJobStatus.COMPLETED,
          100,
          `Successfully imported ${importResult.risksImported} risks, ${importResult.controlsImported} controls, and ${importResult.assessmentsImported} assessments`,
          {
            ...validationResult.metadata,
            importResult,
          }
        );

        await job.progress(100);

        return { success: true, importResult };
      } catch (error) {
        console.error('Job processing error:', error);

        // Update job as failed
        await this.updateJobStatus(
          data.jobId,
          ImportJobStatus.FAILED,
          (job.progress() as number) || 0,
          error instanceof Error ? error.message : 'Unknown error occurred',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );

        throw error;
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', async (job, result) => {
      console.log(`Job ${job.id} completed successfully`);
      // Emit websocket event for real-time updates
      this.emitJobUpdate(job.id, 'completed', result);
    });

    this.queue.on('failed', async (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
      // Emit websocket event for real-time updates
      this.emitJobUpdate(job.id, 'failed', { error: err.message });
    });

    this.queue.on('progress', async (job, progress) => {
      // Emit websocket event for real-time progress updates
      this.emitJobUpdate(job.id, 'progress', { progress });
    });

    this.queue.on('error', (error) => {
      console.error('Queue error:', error);
    });
  }

  /**
   * Update job progress in database
   */
  private async updateProgress(jobId: string, progress: number, message: string): Promise<void> {
    try {
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          progress,
          progressMessage: message,
        },
      });
    } catch (error) {
      console.error('Error updating job progress:', error);
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: ImportJobStatus,
    progress: number,
    message: string,
    metadata?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: ImportJobUpdateData = {
        status,
        progress,
        progressMessage: message,
      };

      if (metadata) {
        updateData.metadata = metadata;
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      if (status === ImportJobStatus.COMPLETED || status === ImportJobStatus.FAILED) {
        updateData.completedAt = new Date();
      }

      await prisma.importJob.update({
        where: { id: jobId },
        data: updateData,
      });
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  /**
   * Emit job update via websocket (placeholder)
   */
  private emitJobUpdate(jobId: string, event: string, data: any): void {
    // TODO: Implement websocket emission for real-time updates
    // This would integrate with your existing websocket infrastructure
    console.log(`Job ${jobId} - ${event}:`, data);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean database
    await prisma.importJob.deleteMany({
      where: {
        completedAt: {
          lt: cutoffDate,
        },
        status: {
          in: [ImportJobStatus.COMPLETED, ImportJobStatus.FAILED, ImportJobStatus.CANCELLED],
        },
      },
    });

    // Clean Bull queue
    await this.queue.clean(daysToKeep * 24 * 60 * 60 * 1000); // Convert to milliseconds
  }
}

// Export singleton instance getter
export function getImportJobService(): ImportJobService {
  return ImportJobService.getInstance();
}
