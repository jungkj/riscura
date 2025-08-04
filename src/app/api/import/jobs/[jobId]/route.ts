import { withApiMiddleware } from '@/lib/api/middleware';
import { getImportJobService } from '@/services/import/job.service';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    jobId: string;
  }
}

// GET job status
export const GET = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard'],
})(async (context, _, { params }: RouteParams) => {
  const { organizationId } = context
  const { jobId } = params;

  try {
    const jobService = getImportJobService();
    const job = await jobService.getJobStatus(jobId);

    if (!job) {
      return {
        error: 'Import job not found',
      }
    }

    // Verify organization access
    if (job.organizationId !== organizationId) {
      return {
        error: 'Access denied',
      }
    }

    // Get additional details
    const jobWithDetails = await prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return {
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        progressMessage: job.progressMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
        metadata: job.metadata,
        importedBy: jobWithDetails?.user
          ? {
              id: jobWithDetails.user.id,
              name: jobWithDetails.user.name,
              email: jobWithDetails.user.email,
            }
          : null,
      },
    }
  } catch (error) {
    // console.error('Error fetching job status:', error)

    return {
      error: 'Failed to fetch job status',
    }
  }
});

// DELETE to cancel job
export const DELETE = withApiMiddleware({
  requireAuth: true,
  rateLimiters: ['standard'],
})(async (context, _, { params }: RouteParams) => {
  const { user, organizationId } = context
  const { jobId } = params;

  try {
    // Verify job exists and belongs to organization
    const job = await prisma.importJob.findFirst({
      where: {
        id: jobId,
        organizationId,
      },
    })

    if (!job) {
      return {
        error: 'Import job not found',
      }
    }

    // Check if job can be cancelled
    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return {
        error: 'Cannot cancel a completed or failed job',
      }
    }

    // Cancel the job
    const jobService = getImportJobService()
    const cancelled = await jobService.cancelJob(jobId);

    if (!cancelled) {
      return {
        error: 'Failed to cancel job',
      }
    }

    return {
      message: 'Import job cancelled successfully',
      jobId,
    }
  } catch (error) {
    // console.error('Error cancelling job:', error)

    return {
      error: 'Failed to cancel job',
    }
  }
});
