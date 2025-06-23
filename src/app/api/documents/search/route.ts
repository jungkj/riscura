import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  fileType?: string;
  uploadedBy?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  status?: string;
}

interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeVersions?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse search parameters
    const filters: SearchFilters = {
      query: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      fileType: searchParams.get('fileType') || undefined,
      uploadedBy: searchParams.get('uploadedBy') || undefined,
      linkedEntityType: searchParams.get('linkedEntityType') || undefined,
      linkedEntityId: searchParams.get('linkedEntityId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      sizeMin: searchParams.get('sizeMin') ? parseInt(searchParams.get('sizeMin')!) : undefined,
      sizeMax: searchParams.get('sizeMax') ? parseInt(searchParams.get('sizeMax')!) : undefined,
      status: searchParams.get('status') || 'active',
    };

    const options: SearchOptions = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      sortBy: searchParams.get('sortBy') || 'uploadedAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      includeVersions: searchParams.get('includeVersions') === 'true',
    };

    // Build search query
    const whereClause = await buildSearchWhereClause(filters, session.user.id);
    
    // Build order clause
    const orderBy = buildOrderClause(options.sortBy!, options.sortOrder!);

    // Calculate pagination
    const skip = (options.page! - 1) * options.limit!;

    // Execute search query
    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          uploadedByUser: {
            select: { id: true, name: true, email: true },
          },
          versions: options.includeVersions ? {
            select: {
              id: true,
              version: true,
              fileName: true,
              fileSize: true,
              uploadedAt: true,
              changeLog: true,
            },
            orderBy: { version: 'desc' },
          } : false,
          _count: {
            select: {
              comments: true,
              shares: true,
            },
          },
        },
        orderBy,
        skip,
        take: options.limit,
      }),
      prisma.document.count({
        where: whereClause,
      }),
    ]);

    // Get search facets for filtering
    const facets = await getSearchFacets(whereClause);

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        category: doc.category,
        tags: doc.tags,
        description: doc.description,
        uploadedBy: doc.uploadedByUser,
        uploadedAt: doc.uploadedAt,
        updatedAt: doc.updatedAt,
        version: doc.version,
        status: doc.status,
        downloadCount: doc.downloadCount,
        lastDownloadedAt: doc.lastDownloadedAt,
        linkedEntityType: doc.linkedEntityType,
        linkedEntityId: doc.linkedEntityId,
        isImage: doc.isImage,
        isDocument: doc.isDocument,
        detectedFileType: doc.detectedFileType,
        versions: doc.versions || undefined,
        commentCount: doc._count.comments,
        shareCount: doc._count.shares,
      })),
      pagination: {
        page: options.page,
        limit: options.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / options.limit!),
      },
      facets,
      filters: filters,
    });

  } catch (error) {
    console.error('Document search error:', error);
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    );
  }
}

/**
 * Build WHERE clause for search query based on filters and user access
 */
async function buildSearchWhereClause(filters: SearchFilters, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, department: true, team: true },
  });

  const whereClause: any = {
    status: filters.status || 'active',
  };

  // Base access control
  if (user?.role !== 'ADMIN') {
    whereClause.OR = [
      // Documents uploaded by user
      { uploadedBy: userId },
      // Documents shared with user
      {
        shares: {
          some: {
            userId,
            expiresAt: { gt: new Date() },
          },
        },
      },
      // Department access for managers
      ...(user?.role === 'MANAGER' && user.department ? [{
        uploadedByUser: {
          department: user.department,
        },
      }] : []),
      // Team access
      ...(user?.team ? [{
        uploadedByUser: {
          team: user.team,
        },
      }] : []),
    ];
  }

  // Text search
  if (filters.query) {
    whereClause.OR = [
      ...(whereClause.OR || []),
      {
        originalName: {
          contains: filters.query,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: filters.query,
          mode: 'insensitive',
        },
      },
      {
        tags: {
          hasSome: [filters.query],
        },
      },
    ];
  }

  // Category filter
  if (filters.category) {
    whereClause.category = filters.category;
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    whereClause.tags = {
      hasAny: filters.tags,
    };
  }

  // File type filter
  if (filters.fileType) {
    whereClause.detectedFileType = filters.fileType;
  }

  // Uploaded by filter
  if (filters.uploadedBy) {
    whereClause.uploadedBy = filters.uploadedBy;
  }

  // Linked entity filters
  if (filters.linkedEntityType) {
    whereClause.linkedEntityType = filters.linkedEntityType;
  }
  if (filters.linkedEntityId) {
    whereClause.linkedEntityId = filters.linkedEntityId;
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    whereClause.uploadedAt = {};
    if (filters.dateFrom) {
      whereClause.uploadedAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      whereClause.uploadedAt.lte = filters.dateTo;
    }
  }

  // File size filter
  if (filters.sizeMin || filters.sizeMax) {
    whereClause.fileSize = {};
    if (filters.sizeMin) {
      whereClause.fileSize.gte = filters.sizeMin;
    }
    if (filters.sizeMax) {
      whereClause.fileSize.lte = filters.sizeMax;
    }
  }

  return whereClause;
}

/**
 * Build ORDER BY clause
 */
function buildOrderClause(sortBy: string, sortOrder: 'asc' | 'desc') {
  const validSortFields = [
    'originalName',
    'fileSize',
    'uploadedAt',
    'updatedAt',
    'downloadCount',
    'category',
    'version',
  ];

  if (!validSortFields.includes(sortBy)) {
    sortBy = 'uploadedAt';
  }

  return { [sortBy]: sortOrder };
}

/**
 * Get search facets for filtering UI
 */
async function getSearchFacets(whereClause: any) {
  try {
    const [
      categories,
      fileTypes,
      uploaders,
      linkedEntityTypes,
    ] = await Promise.all([
      // Categories
      prisma.document.groupBy({
        by: ['category'],
        where: whereClause,
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
      }),
      // File types
      prisma.document.groupBy({
        by: ['detectedFileType'],
        where: whereClause,
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
      }),
      // Uploaders
      prisma.document.groupBy({
        by: ['uploadedBy'],
        where: whereClause,
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 10,
      }),
      // Linked entity types
      prisma.document.groupBy({
        by: ['linkedEntityType'],
        where: {
          ...whereClause,
          linkedEntityType: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
      }),
    ]);

    // Get uploader details
    const uploaderIds = uploaders.map(u => u.uploadedBy);
    const uploaderDetails = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, name: true, email: true },
    });

    return {
      categories: categories.map(c => ({
        value: c.category,
        count: c._count._all,
      })),
      fileTypes: fileTypes.map(ft => ({
        value: ft.detectedFileType,
        count: ft._count._all,
      })),
      uploaders: uploaders.map(u => {
        const details = uploaderDetails.find(ud => ud.id === u.uploadedBy);
        return {
          value: u.uploadedBy,
          label: details?.name || details?.email || 'Unknown',
          count: u._count._all,
        };
      }),
      linkedEntityTypes: linkedEntityTypes.map(item => ({
        value: item.linkedEntityType,
        count: item._count._all,
      })),
    };
  } catch (error) {
    console.error('Error getting search facets:', error);
    return {
      categories: [],
      fileTypes: [],
      uploaders: [],
      linkedEntityTypes: [],
    };
  }
}

// POST - Advanced search with complex queries
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      query, 
      filters = {}, 
      options = {},
      savedSearch = false,
      searchName = '',
    } = body;

    // Build complex search query
    const whereClause = await buildAdvancedSearchWhereClause(query, filters, session.user.id);
    
    // Execute search
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploadedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: options.limit || 50,
    });

    // Save search if requested
    if (savedSearch && searchName) {
      await prisma.savedSearch.create({
        data: {
          name: searchName,
          userId: session.user.id,
          query: JSON.stringify({ query, filters, options }),
          entityType: 'DOCUMENT',
        },
      });
    }

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        category: doc.category,
        uploadedBy: doc.uploadedByUser,
        uploadedAt: doc.uploadedAt,
        relevanceScore: calculateRelevanceScore(doc, query),
      })),
      total: documents.length,
      query,
      filters,
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { error: 'Internal server error during advanced search' },
      { status: 500 }
    );
  }
}

/**
 * Build advanced search WHERE clause
 */
async function buildAdvancedSearchWhereClause(query: any, filters: any, userId: string) {
  // TODO: Implement advanced search logic with boolean operators, exact phrases, etc.
  return await buildSearchWhereClause(filters, userId);
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(document: any, query: string): number {
  if (!query) return 1;

  let score = 0;
  const queryLower = query.toLowerCase();

  // Exact match in filename
  if (document.originalName.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Match in description
  if (document.description?.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Match in tags
  if (document.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
    score += 3;
  }

  // Recent documents get slight boost
  const daysSinceUpload = (Date.now() - new Date(document.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpload < 30) {
    score += 1;
  }

  return Math.max(score, 1);
} 