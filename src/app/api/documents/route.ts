import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config/env';

// GET /api/documents - List documents (demo mode)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // In demo mode, return mock document data
    const mockDocuments = [
      {
        id: 'doc_risk_policy',
        title: 'Enterprise Risk Management Policy',
        description: 'Comprehensive policy document for enterprise risk management',
        category: 'Policy',
        type: 'Governance',
        status: 'Approved',
        version: '2.1',
        ownerId: 'user_admin_demo',
        confidentiality: 'Internal',
        department: 'Risk Management',
        tags: ['policy', 'risk-management', 'governance'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        size: 2500000, // 2.5MB
        owner: {
          id: 'user_admin_demo',
          firstName: 'Alex',
          lastName: 'Administrator',
          email: 'admin@riscura.demo',
        },
        files: [
          {
            id: 'file_1',
            filename: 'ERM_Policy_v2.1.pdf',
            mimeType: 'application/pdf',
            size: 2500000,
            uploadedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        ],
        _count: {
          versions: 3,
        },
      },
      {
        id: 'doc_security_procedures',
        title: 'Cybersecurity Incident Response Procedures',
        description: 'Step-by-step procedures for responding to cybersecurity incidents',
        category: 'Procedure',
        type: 'Operational',
        status: 'Draft',
        version: '1.0',
        ownerId: 'user_manager_demo',
        confidentiality: 'Confidential',
        department: 'IT',
        tags: ['cybersecurity', 'incident-response', 'procedures'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        size: 1800000, // 1.8MB
        owner: {
          id: 'user_manager_demo',
          firstName: 'Maria',
          lastName: 'Manager',
          email: 'manager@riscura.demo',
        },
        files: [
          {
            id: 'file_2',
            filename: 'Incident_Response_Procedures.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 1800000,
            uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        ],
        _count: {
          versions: 1,
        },
      },
      {
        id: 'doc_compliance_framework',
        title: 'GDPR Compliance Framework',
        description: 'Comprehensive framework for GDPR compliance implementation',
        category: 'Framework',
        type: 'Compliance',
        status: 'In Review',
        version: '1.2',
        ownerId: 'user_admin_demo',
        confidentiality: 'Internal',
        department: 'Legal',
        tags: ['gdpr', 'compliance', 'framework', 'privacy'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        size: 3200000, // 3.2MB
        owner: {
          id: 'user_admin_demo',
          firstName: 'Alex',
          lastName: 'Administrator',
          email: 'admin@riscura.demo',
        },
        files: [
          {
            id: 'file_3',
            filename: 'GDPR_Framework_v1.2.pdf',
            mimeType: 'application/pdf',
            size: 3200000,
            uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
        ],
        _count: {
          versions: 2,
        },
      },
    ];

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;

    // Apply filters
    let filteredDocuments = [...mockDocuments];
    
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (category) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (type) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (status) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const total = filteredDocuments.length;
    const paginatedDocuments = filteredDocuments.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedDocuments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
      meta: {
        demoMode: true,
        filters: {
          category,
          type,
          status,
          search,
        },
      },
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create new document (demo mode)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if demo mode
    if (!appConfig.isDevelopment) {
      return NextResponse.json(
        { error: 'Document creation only available in development mode' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Extract document metadata
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const type = formData.get('type') as string;
    const confidentiality = formData.get('confidentiality') as string || 'internal';

    // Validate required fields
    if (!title || !category || !type) {
      return NextResponse.json(
        { error: 'Title, category, and type are required' },
        { status: 400 }
      );
    }

    // Process files
    const files = formData.getAll('files') as File[];
    const processedFiles: any[] = [];

    for (const file of files) {
      if (file && file.size > 0) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds 10MB limit` },
            { status: 400 }
          );
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/png',
          'image/jpeg',
        ];

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `File type ${file.type} not allowed` },
            { status: 400 }
          );
        }

        processedFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date(),
        });
      }
    }

    // Create mock document
    const newDocument = {
      id: `doc_${Date.now()}`,
      title,
      description,
      category,
      type,
      status: 'draft',
      version: '1.0',
      ownerId: 'demo_user',
      confidentiality,
      department: 'Demo Department',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      size: processedFiles.reduce((total, file) => total + file.size, 0),
      files: processedFiles,
      owner: {
        id: 'demo_user',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@riscura.demo',
      },
      _count: {
        versions: 1,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Document created successfully (demo mode)',
      data: newDocument,
    }, { status: 201 });

  } catch (error) {
    console.error('Document creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
} 