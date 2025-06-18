import { NextRequest, NextResponse } from 'next/server';
import { withAPI, createAPIResponse, ForbiddenError, ValidationError, NotFoundError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Questionnaire validation schemas
const questionnaireCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['RISK_ASSESSMENT', 'CONTROL_EVALUATION', 'COMPLIANCE_CHECK', 'VENDOR_ASSESSMENT', 'SELF_ASSESSMENT', 'CUSTOM']),
  category: z.string().optional(),
  framework: z.string().optional(),
  isTemplate: z.boolean().default(false),
  isActive: z.boolean().default(true),
  allowAnonymous: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  maxAttempts: z.number().min(1).optional(),
  timeLimit: z.number().min(0).optional(), // in minutes
  passingScore: z.number().min(0).max(100).optional(),
  randomizeQuestions: z.boolean().default(false),
  showResults: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  questions: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TEXT', 'TEXTAREA', 'NUMBER', 'SCALE', 'BOOLEAN', 'DATE', 'FILE_UPLOAD', 'MATRIX']),
    text: z.string().min(1, 'Question text is required'),
    description: z.string().optional(),
    required: z.boolean().default(false),
    weight: z.number().min(0).max(100).default(1),
    order: z.number().min(0),
    options: z.array(z.object({
      id: z.string().optional(),
      text: z.string(),
      value: z.union([z.string(), z.number()]),
      score: z.number().optional(),
      isCorrect: z.boolean().optional(),
    })).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      customMessage: z.string().optional(),
    }).optional(),
    conditional: z.object({
      dependsOn: z.string(), // question ID
      showWhen: z.union([z.string(), z.number(), z.boolean()]),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']).optional(),
    }).optional(),
    metadata: z.record(z.any()).optional(),
  })).default([]),
  sections: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    order: z.number().min(0),
    questionIds: z.array(z.string()),
  })).optional(),
  scoring: z.object({
    type: z.enum(['POINTS', 'PERCENTAGE', 'WEIGHTED', 'PASS_FAIL', 'CUSTOM']).default('POINTS'),
    maxScore: z.number().min(0).optional(),
    passingScore: z.number().min(0).optional(),
    formula: z.string().optional(), // Custom scoring formula
  }).optional(),
  notifications: z.object({
    onSubmit: z.boolean().default(false),
    onApproval: z.boolean().default(false),
    onCompletion: z.boolean().default(false),
    recipients: z.array(z.string()).default([]),
  }).optional(),
});

const questionnaireUpdateSchema = questionnaireCreateSchema.partial();

const questionnaireQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  isTemplate: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  framework: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).transform((data) => ({
  ...data,
  skip: (data.page - 1) * data.limit,
}));

const questionnaireResponseSchema = z.object({
  questionnaireId: z.string().uuid(),
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number()])),
      z.record(z.any()),
    ]),
    metadata: z.record(z.any()).optional(),
  })),
  metadata: z.record(z.any()).optional(),
});

const questionnaireBulkSchema = z.object({
  create: z.array(questionnaireCreateSchema).optional(),
  update: z.array(z.object({
    id: z.string().uuid(),
  }).merge(questionnaireUpdateSchema)).optional(),
  delete: z.array(z.string().uuid()).optional(),
});

// GET /api/questionnaires - List questionnaires with advanced filtering
export const GET = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = questionnaireQuerySchema.parse(queryParams);

    // Build where clause
    const where: Prisma.QuestionnaireWhereInput = {
      organizationId: user.organizationId,
    };

    // Text search across multiple fields
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (validatedQuery.type) {
      where.type = validatedQuery.type as any;
    }

    if (validatedQuery.category) {
      where.category = { contains: validatedQuery.category, mode: 'insensitive' };
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status as any;
    }

    if (validatedQuery.isTemplate !== undefined) {
      where.isTemplate = validatedQuery.isTemplate;
    }

    if (validatedQuery.isActive !== undefined) {
      where.isActive = validatedQuery.isActive;
    }

    if (validatedQuery.framework) {
      where.framework = { contains: validatedQuery.framework, mode: 'insensitive' };
    }

    if (validatedQuery.createdBy) {
      where.createdBy = validatedQuery.createdBy;
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      where.tags = {
        hasSome: validatedQuery.tags,
      };
    }

    // Date range filters
    if (validatedQuery.createdAfter || validatedQuery.createdBefore) {
      where.createdAt = {};
      if (validatedQuery.createdAfter) {
        where.createdAt.gte = new Date(validatedQuery.createdAfter);
      }
      if (validatedQuery.createdBefore) {
        where.createdAt.lte = new Date(validatedQuery.createdBefore);
      }
    }

    // Count total records
    const total = await db.client.questionnaire.count({ where });

    // Build orderBy
    const orderBy: Prisma.QuestionnaireOrderByWithRelationInput = {};
    if (validatedQuery.sortBy) {
      orderBy[validatedQuery.sortBy as keyof Prisma.QuestionnaireOrderByWithRelationInput] = validatedQuery.sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    // Execute query
    const questionnaires = await db.client.questionnaire.findMany({
      where,
      orderBy,
      skip: validatedQuery.skip,
      take: validatedQuery.limit,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        responses: {
          select: {
            id: true,
            status: true,
            score: true,
            completedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    // Calculate additional metrics
    const enrichedQuestionnaires = questionnaires.map(questionnaire => {
      const responses = questionnaire.responses;
      const totalResponses = questionnaire._count.responses;
      const completedResponses = responses.filter(r => r.status === 'COMPLETED').length;
      const averageScore = responses.length > 0 
        ? responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length 
        : null;

      // Parse questions from JSON if stored as JSON
      const questions = Array.isArray(questionnaire.questions) 
        ? questionnaire.questions 
        : JSON.parse(questionnaire.questions as string || '[]');

      return {
        ...questionnaire,
        questions: questions.length, // Just return count for list view
        totalResponses,
        completedResponses,
        completionRate: totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0,
        averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null,
        recentResponses: responses.slice(0, 3),
      };
    });

    return createAPIResponse({
      data: enrichedQuestionnaires,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        hasNextPage: validatedQuery.skip + validatedQuery.limit < total,
        hasPreviousPage: validatedQuery.skip > 0,
        totalPages: Math.ceil(total / validatedQuery.limit),
      },
      summary: {
        totalQuestionnaires: total,
        activeQuestionnaires: questionnaires.filter(q => q.isActive).length,
        templates: questionnaires.filter(q => q.isTemplate).length,
        totalResponses: questionnaires.reduce((sum, q) => sum + q._count.responses, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw new Error('Failed to fetch questionnaires');
  }
});

// POST /api/questionnaires - Create new questionnaire
export const POST = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = questionnaireCreateSchema.parse(body);

    // Generate IDs for questions and options if not provided
    const processedQuestions = validatedData.questions.map((question, index) => ({
      ...question,
      id: question.id || `q_${Date.now()}_${index}`,
      options: question.options?.map((option, optIndex) => ({
        ...option,
        id: option.id || `opt_${Date.now()}_${index}_${optIndex}`,
      })),
    }));

    // Process sections if provided
    const processedSections = validatedData.sections?.map((section, index) => ({
      ...section,
      id: section.id || `s_${Date.now()}_${index}`,
    }));

    // Create questionnaire
    const questionnaire = await db.client.questionnaire.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        category: validatedData.category,
        framework: validatedData.framework,
        status: 'DRAFT',
        isTemplate: validatedData.isTemplate,
        isActive: validatedData.isActive,
        allowAnonymous: validatedData.allowAnonymous,
        requiresApproval: validatedData.requiresApproval,
        maxAttempts: validatedData.maxAttempts,
        timeLimit: validatedData.timeLimit,
        passingScore: validatedData.passingScore,
        randomizeQuestions: validatedData.randomizeQuestions,
        showResults: validatedData.showResults,
        allowReview: validatedData.allowReview,
        tags: validatedData.tags,
        organizationId: user.organizationId,
        createdBy: user.id,
        questions: processedQuestions,
        sections: processedSections || [],
        scoring: validatedData.scoring || { type: 'POINTS' },
        notifications: validatedData.notifications || { onSubmit: false, onApproval: false, onCompletion: false, recipients: [] },
        metadata: validatedData.metadata,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'QUESTIONNAIRE_CREATED',
        description: `Questionnaire "${questionnaire.title}" created`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'QUESTIONNAIRE',
        entityId: questionnaire.id,
        metadata: {
          questionnaireType: questionnaire.type,
          questionCount: processedQuestions.length,
          isTemplate: questionnaire.isTemplate,
        },
      },
    });

    return createAPIResponse({
      data: questionnaire,
      message: 'Questionnaire created successfully',
    });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid questionnaire data', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create questionnaire');
  }
});

// PUT /api/questionnaires/bulk - Bulk operations on questionnaires
export const PUT = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = questionnaireBulkSchema.parse(body);

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[],
    };

    // Handle bulk create
    if (validatedData.create && validatedData.create.length > 0) {
      for (const questionnaireData of validatedData.create) {
        try {
          const validatedQuestionnaire = questionnaireCreateSchema.parse(questionnaireData);
          
          const processedQuestions = validatedQuestionnaire.questions.map((question, index) => ({
            ...question,
            id: question.id || `q_${Date.now()}_${index}`,
            options: question.options?.map((option, optIndex) => ({
              ...option,
              id: option.id || `opt_${Date.now()}_${index}_${optIndex}`,
            })),
          }));

          await db.client.questionnaire.create({
            data: {
              title: validatedQuestionnaire.title,
              description: validatedQuestionnaire.description,
              type: validatedQuestionnaire.type,
              category: validatedQuestionnaire.category,
              framework: validatedQuestionnaire.framework,
              status: 'DRAFT',
              isTemplate: validatedQuestionnaire.isTemplate,
              isActive: validatedQuestionnaire.isActive,
              allowAnonymous: validatedQuestionnaire.allowAnonymous,
              requiresApproval: validatedQuestionnaire.requiresApproval,
              maxAttempts: validatedQuestionnaire.maxAttempts,
              timeLimit: validatedQuestionnaire.timeLimit,
              passingScore: validatedQuestionnaire.passingScore,
              randomizeQuestions: validatedQuestionnaire.randomizeQuestions,
              showResults: validatedQuestionnaire.showResults,
              allowReview: validatedQuestionnaire.allowReview,
              tags: validatedQuestionnaire.tags,
              organizationId: user.organizationId,
              createdBy: user.id,
              questions: processedQuestions,
              sections: validatedQuestionnaire.sections || [],
              scoring: validatedQuestionnaire.scoring || { type: 'POINTS' },
              notifications: validatedQuestionnaire.notifications || { onSubmit: false, onApproval: false, onCompletion: false, recipients: [] },
              metadata: validatedQuestionnaire.metadata,
            },
          });

          results.created++;
        } catch (error) {
          results.errors.push(`Failed to create questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk update
    if (validatedData.update && validatedData.update.length > 0) {
      for (const updateData of validatedData.update) {
        try {
          const { id, ...questionnaireData } = updateData;
          const validatedQuestionnaire = questionnaireUpdateSchema.parse(questionnaireData);

          const existing = await db.client.questionnaire.findFirst({
            where: {
              id,
              organizationId: user.organizationId,
            },
          });

          if (!existing) {
            results.errors.push(`Questionnaire with ID ${id} not found`);
            continue;
          }

          const updateData: any = {};
          
          if (validatedQuestionnaire.title) updateData.title = validatedQuestionnaire.title;
          if (validatedQuestionnaire.description !== undefined) updateData.description = validatedQuestionnaire.description;
          if (validatedQuestionnaire.type) updateData.type = validatedQuestionnaire.type;
          if (validatedQuestionnaire.category !== undefined) updateData.category = validatedQuestionnaire.category;
          if (validatedQuestionnaire.framework !== undefined) updateData.framework = validatedQuestionnaire.framework;
          if (validatedQuestionnaire.isTemplate !== undefined) updateData.isTemplate = validatedQuestionnaire.isTemplate;
          if (validatedQuestionnaire.isActive !== undefined) updateData.isActive = validatedQuestionnaire.isActive;
          if (validatedQuestionnaire.allowAnonymous !== undefined) updateData.allowAnonymous = validatedQuestionnaire.allowAnonymous;
          if (validatedQuestionnaire.requiresApproval !== undefined) updateData.requiresApproval = validatedQuestionnaire.requiresApproval;
          if (validatedQuestionnaire.maxAttempts !== undefined) updateData.maxAttempts = validatedQuestionnaire.maxAttempts;
          if (validatedQuestionnaire.timeLimit !== undefined) updateData.timeLimit = validatedQuestionnaire.timeLimit;
          if (validatedQuestionnaire.passingScore !== undefined) updateData.passingScore = validatedQuestionnaire.passingScore;
          if (validatedQuestionnaire.randomizeQuestions !== undefined) updateData.randomizeQuestions = validatedQuestionnaire.randomizeQuestions;
          if (validatedQuestionnaire.showResults !== undefined) updateData.showResults = validatedQuestionnaire.showResults;
          if (validatedQuestionnaire.allowReview !== undefined) updateData.allowReview = validatedQuestionnaire.allowReview;
          if (validatedQuestionnaire.tags) updateData.tags = validatedQuestionnaire.tags;
          if (validatedQuestionnaire.metadata) updateData.metadata = validatedQuestionnaire.metadata;

          if (validatedQuestionnaire.questions) {
            const processedQuestions = validatedQuestionnaire.questions.map((question, index) => ({
              ...question,
              id: question.id || `q_${Date.now()}_${index}`,
              options: question.options?.map((option, optIndex) => ({
                ...option,
                id: option.id || `opt_${Date.now()}_${index}_${optIndex}`,
              })),
            }));
            updateData.questions = processedQuestions;
          }

          if (validatedQuestionnaire.sections) {
            updateData.sections = validatedQuestionnaire.sections;
          }

          if (validatedQuestionnaire.scoring) {
            updateData.scoring = validatedQuestionnaire.scoring;
          }

          if (validatedQuestionnaire.notifications) {
            updateData.notifications = validatedQuestionnaire.notifications;
          }

          await db.client.questionnaire.update({
            where: { id },
            data: updateData,
          });

          results.updated++;
        } catch (error) {
          results.errors.push(`Failed to update questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Handle bulk delete
    if (validatedData.delete && validatedData.delete.length > 0) {
      for (const questionnaireId of validatedData.delete) {
        try {
          const existing = await db.client.questionnaire.findFirst({
            where: {
              id: questionnaireId,
              organizationId: user.organizationId,
            },
          });

          if (!existing) {
            results.errors.push(`Questionnaire with ID ${questionnaireId} not found`);
            continue;
          }

          await db.client.questionnaire.delete({
            where: { id: questionnaireId },
          });

          results.deleted++;
        } catch (error) {
          results.errors.push(`Failed to delete questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Log bulk activity
    await db.client.activity.create({
      data: {
        type: 'QUESTIONNAIRE_BULK_OPERATION',
        description: `Bulk questionnaire operation: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted`,
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
      message: `Bulk operation completed: ${results.created + results.updated + results.deleted} questionnaires processed`,
    });
  } catch (error) {
    console.error('Error in bulk questionnaires operation:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid bulk operation data', error.errors);
    }
    throw new Error('Failed to perform bulk operation');
  }
});

// POST /api/questionnaires/responses - Submit questionnaire response
export const POST_RESPONSE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const body = await req.json();
    const validatedData = questionnaireResponseSchema.parse(body);

    // Validate questionnaire exists and is active
    const questionnaire = await db.client.questionnaire.findFirst({
      where: {
        id: validatedData.questionnaireId,
        organizationId: user.organizationId,
        isActive: true,
      },
    });

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found or inactive');
    }

    // Check if user has already reached max attempts
    if (questionnaire.maxAttempts) {
      const existingResponses = await db.client.response.count({
        where: {
          questionnaireId: validatedData.questionnaireId,
          userId: user.id,
        },
      });

      if (existingResponses >= questionnaire.maxAttempts) {
        throw new ForbiddenError('Maximum attempts exceeded');
      }
    }

    // Calculate score based on responses
    const score = calculateQuestionnaireScore(questionnaire, validatedData.responses);
    const passed = questionnaire.passingScore ? score >= questionnaire.passingScore : null;

    // Create response
    const response = await db.client.response.create({
      data: {
        questionnaireId: validatedData.questionnaireId,
        userId: user.id,
        organizationId: user.organizationId,
        answers: validatedData.responses,
        score,
        passed,
        status: questionnaire.requiresApproval ? 'PENDING_APPROVAL' : 'COMPLETED',
        completedAt: questionnaire.requiresApproval ? null : new Date(),
        metadata: validatedData.metadata || {},
      },
      include: {
        questionnaire: {
          select: {
            id: true,
            title: true,
            type: true,
            passingScore: true,
            showResults: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'QUESTIONNAIRE_RESPONSE_SUBMITTED',
        description: `Response submitted for questionnaire "${questionnaire.title}"`,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'RESPONSE',
        entityId: response.id,
        metadata: {
          questionnaireId: validatedData.questionnaireId,
          score,
          passed,
          requiresApproval: questionnaire.requiresApproval,
        },
      },
    });

    // Send notifications if configured
    if (questionnaire.notifications && questionnaire.notifications.onSubmit) {
      // TODO: Implement notification sending
    }

    return createAPIResponse({
      data: {
        ...response,
        showScore: questionnaire.showResults,
        showCorrectAnswers: questionnaire.showResults && questionnaire.allowReview,
      },
      message: questionnaire.requiresApproval 
        ? 'Response submitted and pending approval' 
        : 'Response submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting questionnaire response:', error);
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid response data', error.errors);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to submit response');
  }
});

// Helper function to calculate questionnaire score
function calculateQuestionnaireScore(questionnaire: any, responses: any[]): number {
  const questions = Array.isArray(questionnaire.questions) 
    ? questionnaire.questions 
    : JSON.parse(questionnaire.questions || '[]');
  
  const scoring = questionnaire.scoring || { type: 'POINTS' };
  
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const response of responses) {
    const question = questions.find((q: any) => q.id === response.questionId);
    if (!question) continue;

    const questionWeight = question.weight || 1;
    maxPossibleScore += questionWeight;

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'SINGLE_CHOICE':
        const selectedOptions = Array.isArray(response.answer) ? response.answer : [response.answer];
        const questionScore = selectedOptions.reduce((sum: number, selectedValue: any) => {
          const option = question.options?.find((opt: any) => opt.value === selectedValue);
          return sum + (option?.score || (option?.isCorrect ? questionWeight : 0));
        }, 0);
        totalScore += Math.min(questionScore, questionWeight);
        break;

      case 'SCALE':
        if (typeof response.answer === 'number') {
          const maxScale = question.validation?.max || 10;
          totalScore += (response.answer / maxScale) * questionWeight;
        }
        break;

      case 'BOOLEAN':
        const correctAnswer = question.options?.[0]?.isCorrect;
        if (correctAnswer !== undefined && response.answer === correctAnswer) {
          totalScore += questionWeight;
        }
        break;

      case 'TEXT':
      case 'TEXTAREA':
        // For text questions, assume full points if answered (manual grading needed)
        if (response.answer && String(response.answer).trim()) {
          totalScore += questionWeight;
        }
        break;

      default:
        // For other question types, assume full points if answered
        if (response.answer !== null && response.answer !== undefined) {
          totalScore += questionWeight;
        }
    }
  }

  // Calculate final score based on scoring type
  switch (scoring.type) {
    case 'PERCENTAGE':
      return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    case 'WEIGHTED':
      return totalScore;
    
    case 'PASS_FAIL':
      const threshold = scoring.passingScore || questionnaire.passingScore || 70;
      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      return percentage >= threshold ? 100 : 0;
    
    case 'CUSTOM':
      // TODO: Implement custom scoring formula evaluation
      return totalScore;
    
    case 'POINTS':
    default:
      return Math.round(totalScore);
  }
} 