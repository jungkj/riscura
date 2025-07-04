import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/risks/route';
import { GET as GetSingle, PUT as PutSingle, DELETE as DeleteSingle } from '@/app/api/risks/[id]/route';
import { RiskFactory, testRisks } from '../../factories/risk-factory';
import { UserFactory, testUsers } from '../../factories/user-factory';
import { OrganizationFactory, testOrganizations } from '../../factories/organization-factory';
import { db } from '@/lib/db';
import { CreateRiskOptions } from '@/services/RiskService';
import { RiskCategory } from '@prisma/client';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    risk: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    risk: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

// Mock authentication
jest.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

describe('/api/risks', () => {
  let mockUser: any;
  let mockOrganization: any;
  let mockRisk: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = testUsers.user;
    mockOrganization = testOrganizations.default;
    mockRisk = testRisks.operational;

    // Setup default auth mock
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue({ user: mockUser });
  });

  describe('GET /api/risks', () => {
    it('should return all risks for the user organization', async () => {
      const mockRisks = RiskFactory.createForOrganization(mockOrganization.id, 5);
      (mockDb.risk.findMany as jest.Mock).mockResolvedValue(mockRisks);

      const request = new NextRequest('http://localhost:3000/api/risks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(5);
      expect(data.data[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        likelihood: expect.any(Number),
        impact: expect.any(Number),
        riskScore: expect.any(Number),
      });

      expect(mockDb.risk.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockUser.organizationId },
        include: expect.objectContaining({
          creator: true,
          assignedUser: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should support pagination', async () => {
      const mockRisks = RiskFactory.createBatch(3);
      (mockDb.risk.findMany as jest.Mock).mockResolvedValue(mockRisks);
      (mockDb.risk.count as jest.Mock).mockResolvedValue(10);

      const request = new NextRequest('http://localhost:3000/api/risks?page=2&limit=3');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.pagination).toEqual({
        page: 2,
        limit: 3,
        total: 10,
        totalPages: 4,
      });

      expect(mockDb.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 3, // (page - 1) * limit
          take: 3,
        })
      );
    });

    it('should support filtering by category', async () => {
      const operationalRisks = RiskFactory.createByCategory(RiskCategory.OPERATIONAL, 2);
      (mockDb.risk.findMany as jest.Mock).mockResolvedValue(operationalRisks);

      const request = new NextRequest('http://localhost:3000/api/risks?category=OPERATIONAL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].category).toBe('OPERATIONAL');

      expect(mockDb.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'OPERATIONAL',
          }),
        })
      );
    });

    it('should support search functionality', async () => {
      const searchRisks = [RiskFactory.create({ title: 'Data Security Risk' })];
            (mockDb.risk.findMany as jest.Mock).mockResolvedValue(searchRisks);

      const request = new NextRequest('http://localhost:3000/api/risks?search=security');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);

      expect(mockDb.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: expect.objectContaining({ contains: 'security', mode: 'insensitive' }) },
              { description: expect.objectContaining({ contains: 'security', mode: 'insensitive' }) },
            ]),
          }),
        })
      );
    });

    it('should handle unauthorized access', async () => {
      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/risks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      (mockDb.risk.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/risks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/risks', () => {
    const validRiskData: CreateRiskOptions = {
      title: 'New Test Risk',
      description: 'A new risk for testing',
      category: 'OPERATIONAL' as RiskCategory,
      likelihood: 3,
      impact: 4,
      owner: mockUser.id,
      status: 'identified' as const,
      controls: [],
      evidence: [],
    };

    it('should create a new risk with valid data', async () => {
      const createdRisk = RiskFactory.create({
        ...validRiskData,
        id: 'new-risk-id',
        organizationId: mockUser.organizationId,
        createdBy: mockUser.id,
      } as any);

      (mockDb.risk.create as jest.Mock).mockResolvedValue(createdRisk);

      const request = new NextRequest('http://localhost:3000/api/risks', {
        method: 'POST',
        body: JSON.stringify(validRiskData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        title: validRiskData.title,
        description: validRiskData.description,
        category: validRiskData.category,
        likelihood: validRiskData.likelihood,
        impact: validRiskData.impact,
      });

      expect(mockDb.risk.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...validRiskData,
          organizationId: mockUser.organizationId,
          createdBy: mockUser.id,
          riskScore: 12, // likelihood * impact
        }),
        include: expect.any(Object),
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Valid description',
        category: 'OPERATIONAL' as const,
        likelihood: 6, // Out of range
        impact: 0, // Out of range
      };

      const request = new NextRequest('http://localhost:3000/api/risks', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeInstanceOf(Array);
      expect(data.details.length).toBeGreaterThan(0);
    });

    it('should calculate risk score automatically', async () => {
      const riskData = { ...validRiskData, likelihood: 4, impact: 5 };
      const expectedScore = 20; // 4 * 5

      const createdRisk = RiskFactory.create({
        ...riskData,
        riskScore: expectedScore,
      } as any);

      (mockDb.risk.create as jest.Mock).mockResolvedValue(createdRisk);

      const request = new NextRequest('http://localhost:3000/api/risks', {
        method: 'POST',
        body: JSON.stringify(riskData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.riskScore).toBe(expectedScore);

      expect(mockDb.risk.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            riskScore: expectedScore,
          }),
        })
      );
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/risks', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON in request body');
    });
  });

  describe('GET /api/risks/[id]', () => {
    it('should return a specific risk by ID', async () => {
      const riskId = 'test-risk-id';
      const mockRiskWithDetails = {
        ...mockRisk,
        id: riskId,
        controls: [],
        evidence: [],
        comments: [],
        creator: mockUser,
        assignedUser: mockUser,
      };

      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(mockRiskWithDetails);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`);
      const response = await GetSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(riskId);
      expect(data.data).toHaveProperty('controls');
      expect(data.data).toHaveProperty('evidence');
      expect(data.data).toHaveProperty('creator');

      expect(mockDb.risk.findUnique).toHaveBeenCalledWith({
        where: { 
          id: riskId,
          organizationId: mockUser.organizationId 
        },
        include: expect.objectContaining({
          controls: true,
          evidence: true,
          comments: true,
          creator: true,
          assignedUser: true,
        }),
      });
    });

    it('should return 404 for non-existent risk', async () => {
      const riskId = 'non-existent-risk';
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`);
      const response = await GetSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Risk not found');
    });

    it('should enforce organization isolation', async () => {
      const riskId = 'other-org-risk';
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(null); // Risk exists but not in user's org

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`);
      const response = await GetSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Risk not found');

      expect(mockDb.risk.findUnique).toHaveBeenCalledWith({
        where: { 
          id: riskId,
          organizationId: mockUser.organizationId // Ensures org isolation
        },
        include: expect.any(Object),
      });
    });
  });

  describe('PUT /api/risks/[id]', () => {
    const updateData = {
      title: 'Updated Risk Title',
      description: 'Updated description',
      likelihood: 4,
      impact: 3,
      status: 'MITIGATED',
    };

    it('should update an existing risk', async () => {
      const riskId = 'test-risk-id';
      const updatedRisk = {
        ...mockRisk,
        ...updateData,
        riskScore: 12, // 4 * 3
        updatedAt: new Date(),
      };

      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(mockRisk);
      (mockDb.risk.update as jest.Mock).mockResolvedValue(updatedRisk);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PutSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(updateData.title);
      expect(data.data.riskScore).toBe(12);

      expect(mockDb.risk.update).toHaveBeenCalledWith({
        where: { id: riskId },
        data: expect.objectContaining({
          ...updateData,
          riskScore: 12,
        }),
        include: expect.any(Object),
      });
    });

    it('should validate update data', async () => {
      const riskId = 'test-risk-id';
      const invalidUpdateData = {
        likelihood: 10, // Invalid value
        impact: -1, // Invalid value
        status: 'INVALID_STATUS',
      };

      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(mockRisk);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`, {
        method: 'PUT',
        body: JSON.stringify(invalidUpdateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PutSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });

    it('should return 404 for non-existent risk', async () => {
      const riskId = 'non-existent-risk';
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PutSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Risk not found');
    });
  });

  describe('DELETE /api/risks/[id]', () => {
    it('should delete an existing risk', async () => {
      const riskId = 'test-risk-id';
      
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(mockRisk);
      (mockDb.risk.delete as jest.Mock).mockResolvedValue(mockRisk);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`, {
        method: 'DELETE',
      });

      const response = await DeleteSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Risk deleted successfully');

      expect(mockDb.risk.delete).toHaveBeenCalledWith({
        where: { id: riskId },
      });
    });

    it('should return 404 for non-existent risk', async () => {
      const riskId = 'non-existent-risk';
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`, {
        method: 'DELETE',
      });

      const response = await DeleteSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Risk not found');
    });

    it('should handle foreign key constraints', async () => {
      const riskId = 'risk-with-dependencies';
      
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(mockRisk);
      (mockDb.risk.delete as jest.Mock).mockRejectedValue({
        code: 'P2003', // Prisma foreign key constraint error
        message: 'Foreign key constraint failed',
      });

      const request = new NextRequest(`http://localhost:3000/api/risks/${riskId}`, {
        method: 'DELETE',
      });

      const response = await DeleteSingle(request, { params: { id: riskId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot delete risk with existing dependencies');
    });
  });

  describe('Multi-tenant Data Isolation', () => {
    it('should only return risks from user organization', async () => {
      const userOrgRisks = RiskFactory.createForOrganization(mockUser.organizationId, 3);
      const otherOrgRisks = RiskFactory.createForOrganization('other-org-id', 2);
      
      // Mock should only return risks from user's organization
      (mockDb.risk.findMany as jest.Mock).mockResolvedValue(userOrgRisks);

      const request = new NextRequest('http://localhost:3000/api/risks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
      expect(data.data.every((risk: any) => risk.organizationId === mockUser.organizationId)).toBe(true);

      expect(mockDb.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockUser.organizationId,
          }),
        })
      );
    });

    it('should prevent cross-organization risk access', async () => {
      const otherOrgRiskId = 'other-org-risk-id';
      
      // Risk exists but in different organization
      (mockDb.risk.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/risks/${otherOrgRiskId}`);
      const response = await GetSingle(request, { params: { id: otherOrgRiskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Risk not found');

      expect(mockDb.risk.findUnique).toHaveBeenCalledWith({
        where: { 
          id: otherOrgRiskId,
          organizationId: mockUser.organizationId // Enforces isolation
        },
        include: expect.any(Object),
      });
    });
  });
});
 