import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError, ValidationError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { controlCreateSchema, controlUpdateSchema, controlBulkSchema, controlQuerySchema } from '@/lib/api/schemas';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// GET /api/controls - List controls with advanced filtering
export const GET = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = controlQuerySchema.parse(queryParams);

    // Build where clause
    const where: Prisma.ControlWhereInput = {
      organizationId: user.organizationId,
    };

    // Text search across multiple fields
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { controlId: { contains: validatedQuery.search, mode: 'insensitive' } },
        { category: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (validatedQuery.category) {
      where.category = validatedQuery.category;
    }

    // Filter by type
    if (validatedQuery.type) {
      where.type = validatedQuery.type;
    }

    // Filter by status
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Filter by effectiveness
    if (validatedQuery.effectiveness) {
      where.effectiveness = validatedQuery.effectiveness;
    }

    // Filter by implementation status
    if (validatedQuery.implementationStatus) {
      where.implementationStatus = validatedQuery.implementationStatus;
    }

    // Filter by owner
    if (validatedQuery.ownerId) {
      where.ownerId = validatedQuery.ownerId;
    }

    // Filter by framework
    if (validatedQuery.framework) {
      where.frameworks = {
        some: {
          name: validatedQuery.framework,
        },
      };
    }

    // Filter by tags
    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      where.tags = {
        hasSome: validatedQuery.tags,
      };
    }

    // Date range filters
    if (validatedQuery.createdAfter) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(validatedQuery.createdAfter),
      };
    }

    if (validatedQuery.createdBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(validatedQuery.createdBefore),
      };
    }

    // Review date filters
    if (validatedQuery.reviewDue) {
      where.nextReviewDate = {
        lte: new Date(),
      };
    }

    // Count total records for pagination
    const total = await db.client.control.count({ where });

    // Build orderBy
    const orderBy: Prisma.ControlOrderByWithRelationInput = {};
    if (validatedQuery.sortBy) {
      orderBy[validatedQuery.sortBy as keyof Prisma.ControlOrderByWithRelationInput] = validatedQuery.sortOrder || 'asc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    // Execute query
    const controls = await db.client.control.findMany({
      where,
      orderBy,
      skip: validatedQuery.skip,
      take: validatedQuery.limit,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        frameworks: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
        risks: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        assessments: {
          select: {
            id: true,
            status: true,
            score: true,
            assessedAt: true,
          },
          orderBy: {
            assessedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            risks: true,
            documents: true,
            assessments: true,
          },
        },
      },
    });

    // Calculate pagination info
    const hasNextPage = validatedQuery.skip + validatedQuery.limit < total;
    const hasPreviousPage = validatedQuery.skip > 0;

    return createAPIResponse({
      data: controls,
      pagination: {
        total,
        page: Math.floor(validatedQuery.skip / validatedQuery.limit) + 1,
        limit: validatedQuery.limit,
        hasNextPage,
        hasPreviousPage,
        totalPages: Math.ceil(total / validatedQuery.limit),
      },
      filters: {
        search: validatedQuery.search,
        category: validatedQuery.category,
        type: validatedQuery.type,
        status: validatedQuery.status,
        effectiveness: validatedQuery.effectiveness,
        implementationStatus: validatedQuery.implementationStatus,
        framework: validatedQuery.framework,
        tags: validatedQuery.tags,
      },
    });
  } catch (error) {
    console.error('Error fetching controls:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw new Error('Failed to fetch controls');
  }
});

// POST /api/controls - Create new control
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = controlCreateSchema.parse(body);

    // Check if control ID already exists
    if (validatedData.controlId) {
      const existingControl = await db.client.control.findFirst({
        where: {
          controlId: validatedData.controlId,
          organizationId: user.organizationId,
        },
      });

      if (existingControl) {
        throw new ValidationError('Control ID already exists');
      }
    }

    // Validate owner exists
    if (validatedData.ownerId) {
      const owner = await db.client.user.findFirst({
        where: {
          id: validatedData.ownerId,
          organizationId: user.organizationId,
        },
      });

      if (!owner) {
        throw new ValidationError('Invalid owner ID');
      }
    }

    // Create control
    const control = await db.client.control.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        createdById: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        frameworks: true,
        _count: {
          select: {
            risks: true,
            documents: true,
            assessments: true,
          },
        },
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'CONTROL_CREATED',
        description: `Control "${control.title}" created`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'CONTROL',
        entityId: control.id,
        metadata: {
          controlId: control.controlId,
          category: control.category,
          type: control.type,
        },
      },
    });

    return createAPIResponse({
      data: control,
      message: 'Control created successfully',
    }, 201);
  } catch (error) {
    console.error('Error creating control:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid control data', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create control');
  }
});

// PUT /api/controls/bulk - Bulk operations on controls
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = controlBulkSchema.parse(body);

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[],
    };

    // Handle bulk create
    if (validatedData.create && validatedData.create.length > 0) {
      for (const controlData of validatedData.create) {
        try {
          const validatedControl = controlCreateSchema.parse(controlData);
          
          // Check for duplicate control ID
          if (validatedControl.controlId) {
            const existing = await db.client.control.findFirst({
              where: {
                controlId: validatedControl.controlId,
                organizationId: user.organizationId,
              },
            });

            if (existing) {
              results.errors.push(`Control ID ${validatedControl.controlId} already exists`);
              continue;
            }
          }

          await db.client.control.create({
            data: {
              ...validatedControl,
              organizationId: user.organizationId,
              createdById: user.id,
            },
          });

          results.created++;
        } catch (error) {
          results.errors.push(`Failed to create control: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk update
    if (validatedData.update && validatedData.update.length > 0) {
      for (const updateData of validatedData.update) {
        try {
          const { id, ...controlData } = updateData;
          const validatedControl = controlUpdateSchema.parse(controlData);

          const existing = await db.client.control.findFirst({
            where: {
              id,
              organizationId: user.organizationId,
            },
          });

          if (!existing) {
            results.errors.push(`Control with ID ${id} not found`);
            continue;
          }

          await db.client.control.update({
            where: { id },
            data: validatedControl,
          });

          results.updated++;
        } catch (error) {
          results.errors.push(`Failed to update control: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk delete
    if (validatedData.delete && validatedData.delete.length > 0) {
      for (const controlId of validatedData.delete) {
        try {
          const existing = await db.client.control.findFirst({
            where: {
              id: controlId,
              organizationId: user.organizationId,
            },
          });

          if (!existing) {
            results.errors.push(`Control with ID ${controlId} not found`);
            continue;
          }

          await db.client.control.delete({
            where: { id: controlId },
          });

          results.deleted++;
        } catch (error) {
          results.errors.push(`Failed to delete control: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Log bulk activity
    await db.client.activity.create({
      data: {
        type: 'CONTROLS_BULK_OPERATION',
        description: `Bulk operation: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          created: results.created,
          updated: results.updated,
          deleted: results.deleted,
          errors: results.errors.length,
        },
      },
    });

    return createAPIResponse({
      data: results,
      message: `Bulk operation completed: ${results.created + results.updated + results.deleted} controls processed`,
    });
  } catch (error) {
    console.error('Error in bulk controls operation:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid bulk operation data', error.errors);
    }
    throw new Error('Failed to perform bulk operation');
  }
});

// DELETE /api/controls - Bulk delete controls
export const DELETE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      throw new ValidationError('No control IDs provided');
    }

    // Validate all controls exist and belong to organization
    const controls = await db.client.control.findMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId,
      },
      select: { id: true, title: true },
    });

    if (controls.length !== ids.length) {
      const foundIds = controls.map(c => c.id);
      const missingIds = ids.filter(id => !foundIds.includes(id));
      throw new ValidationError(`Controls not found: ${missingIds.join(', ')}`);
    }

    // Delete controls (cascade will handle related records)
    const deleteResult = await db.client.control.deleteMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId,
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'CONTROLS_BULK_DELETE',
        description: `Bulk deleted ${deleteResult.count} controls`,
        userId: user.id,
        organizationId: user.organizationId,
        metadata: {
          deletedCount: deleteResult.count,
          controlIds: ids,
          controlTitles: controls.map(c => c.title),
        },
      },
    });

    return createAPIResponse({
      data: { deletedCount: deleteResult.count },
      message: `${deleteResult.count} controls deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting controls:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete controls');
  }
}); 