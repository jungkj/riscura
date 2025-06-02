import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, NotFoundError, ForbiddenError, ConflictError } from './middleware';
import { bulkOperationSchema } from './schemas';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { PERMISSIONS } from '@/lib/auth';

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  results: Array<{
    id: string;
    operation: string;
    status: 'success' | 'failed';
    data?: any;
  }>;
}

// Generic bulk operation handler
export function createBulkHandler(
  entityType: 'risk' | 'control' | 'document' | 'questionnaire' | 'workflow' | 'report',
  requiredPermissions: string[]
) {
  return withAPI(
    withValidation(bulkOperationSchema)(async (req: NextRequest, data: any) => {
      const authReq = req as AuthenticatedRequest;
      const user = getAuthenticatedUser(authReq);

      if (!user) {
        throw new ForbiddenError('Authentication required');
      }

      const { operation, ids, data: updateData, confirm } = data;

      // Validate entities exist and belong to organization
      const entityTable = getEntityTable(entityType);
      const entities = await db.client[entityTable].findMany({
        where: {
          id: { in: ids },
          organizationId: user.organizationId,
        },
        select: { id: true, title: true },
      });

      if (entities.length !== ids.length) {
        const foundIds = entities.map((e: any) => e.id);
        const missingIds = ids.filter((id: string) => !foundIds.includes(id));
        throw new NotFoundError(`Entities not found: ${missingIds.join(', ')}`);
      }

      // Destructive operations require confirmation
      if (['delete', 'archive'].includes(operation) && !confirm) {
        return createAPIResponse({
          requiresConfirmation: true,
          operation,
          entityCount: ids.length,
          entities: entities.map((e: any) => ({ id: e.id, title: e.title })),
          message: `This will ${operation} ${ids.length} ${entityType}(s). Please confirm.`,
        });
      }

      const result: BulkOperationResult = {
        success: 0,
        failed: 0,
        errors: [],
        results: [],
      };

      // Process each entity
      for (const entity of entities) {
        try {
          let operationResult;

          switch (operation) {
            case 'update':
              operationResult = await updateEntity(entityTable, entity.id, updateData, user.id);
              break;
            case 'delete':
              operationResult = await deleteEntity(entityTable, entity.id, entityType);
              break;
            case 'archive':
              operationResult = await archiveEntity(entityTable, entity.id, user.id);
              break;
            case 'export':
              operationResult = await exportEntity(entityTable, entity.id);
              break;
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }

          result.success++;
          result.results.push({
            id: entity.id,
            operation,
            status: 'success',
            data: operationResult,
          });

        } catch (error) {
          result.failed++;
          result.errors.push({
            id: entity.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          result.results.push({
            id: entity.id,
            operation,
            status: 'failed',
          });
        }
      }

      // Log bulk operation
      await db.client.activity.create({
        data: {
          type: 'BULK_OPERATION',
          entityType: entityType.toUpperCase(),
          entityId: 'bulk',
          description: `Bulk ${operation} on ${ids.length} ${entityType}(s)`,
          userId: user.id,
          organizationId: user.organizationId,
          metadata: {
            operation,
            entityType,
            entityCount: ids.length,
            successCount: result.success,
            failedCount: result.failed,
            entityIds: ids,
          },
          isPublic: false,
        },
      });

      return createAPIResponse(result);
    }),
    {
      requiredPermissions,
      rateLimit: { limit: 10, windowMs: 5 * 60 * 1000 }, // Stricter rate limiting for bulk ops
    }
  );
}

// Helper functions
function getEntityTable(entityType: string): string {
  const tableMap: Record<string, string> = {
    risk: 'risk',
    control: 'control',
    document: 'document',
    questionnaire: 'questionnaire',
    workflow: 'workflow',
    report: 'report',
  };
  
  return tableMap[entityType] || entityType;
}

async function updateEntity(table: string, id: string, updateData: any, userId: string): Promise<any> {
  return await (db.client as any)[table].update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date(),
    },
  });
}

async function deleteEntity(table: string, id: string, entityType: string): Promise<any> {
  // Check for dependencies before deletion
  await checkDependencies(table, id, entityType);
  
  return await (db.client as any)[table].delete({
    where: { id },
  });
}

async function archiveEntity(table: string, id: string, userId: string): Promise<any> {
  return await (db.client as any)[table].update({
    where: { id },
    data: {
      status: 'archived',
      updatedById: userId,
      updatedAt: new Date(),
    },
  });
}

async function exportEntity(table: string, id: string): Promise<any> {
  return await (db.client as any)[table].findUnique({
    where: { id },
    include: getExportIncludes(table),
  });
}

async function checkDependencies(table: string, id: string, entityType: string): Promise<void> {
  if (entityType === 'risk') {
    const controls = await db.client.control.count({
      where: { riskIds: { has: id } },
    });
    
    if (controls > 0) {
      throw new ConflictError('Cannot delete risk with associated controls');
    }
  }
  
  if (entityType === 'control') {
    const activeTests = await db.client.controlTest.count({
      where: { 
        controlId: id,
        result: { not: 'completed' },
      },
    });
    
    if (activeTests > 0) {
      throw new ConflictError('Cannot delete control with active tests');
    }
  }
}

function getExportIncludes(table: string): any {
  const includeMap: Record<string, any> = {
    risk: {
      owner: true,
      controls: true,
      riskAssessments: true,
      documents: true,
    },
    control: {
      owner: true,
      operator: true,
      reviewer: true,
      risks: true,
      controlTests: true,
      documents: true,
    },
    document: {
      owner: true,
      approvedBy: true,
      risks: true,
      controls: true,
    },
    questionnaire: {
      owner: true,
      assignees: true,
      responses: true,
    },
    workflow: {
      owner: true,
      assignees: true,
      approvers: true,
      steps: true,
    },
    report: {
      owner: true,
      recipients: true,
    },
  };
  
  return includeMap[table] || {};
}

// Bulk validation utilities
export async function validateBulkIds(
  ids: string[],
  entityType: string,
  organizationId: string
): Promise<{ valid: string[]; invalid: string[] }> {
  const table = getEntityTable(entityType);
  
  const entities = await (db.client as any)[table].findMany({
    where: {
      id: { in: ids },
      organizationId,
    },
    select: { id: true },
  });
  
  const valid = entities.map((e: any) => e.id);
  const invalid = ids.filter(id => !valid.includes(id));
  
  return { valid, invalid };
}

// Bulk progress tracking
export class BulkOperationProgress {
  private progressMap = new Map<string, {
    total: number;
    completed: number;
    failed: number;
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
  }>();

  startOperation(operationId: string, total: number): void {
    this.progressMap.set(operationId, {
      total,
      completed: 0,
      failed: 0,
      status: 'running',
      startTime: new Date(),
    });
  }

  updateProgress(operationId: string, completed: number, failed: number): void {
    const progress = this.progressMap.get(operationId);
    if (progress) {
      progress.completed = completed;
      progress.failed = failed;
      
      if (completed + failed >= progress.total) {
        progress.status = failed > 0 ? 'failed' : 'completed';
        progress.endTime = new Date();
      }
    }
  }

  getProgress(operationId: string) {
    return this.progressMap.get(operationId);
  }

  cleanup(operationId: string): void {
    this.progressMap.delete(operationId);
  }
}

export const bulkProgress = new BulkOperationProgress(); 