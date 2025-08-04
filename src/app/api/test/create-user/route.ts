import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import bcrypt from 'bcryptjs';

export async function POST(_request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    // Find or create organization
    let organization = await prisma.organization.findFirst({
      where: { domain: 'riscura.com' },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Riscura Demo Organization',
          domain: 'riscura.com',
          plan: 'enterprise',
          isActive: true,
          settings: {
            riskMatrixSize: 5,
            defaultRiskCategories: [
              'OPERATIONAL',
              'FINANCIAL',
              'STRATEGIC',
              'COMPLIANCE',
              'TECHNOLOGY',
            ],
          },
        },
      });
    }

    // Create test user credentials
    const testUserEmail = 'testuser@riscura.com';
    const testUserPassword = 'test123';
    const passwordHash = await bcrypt.hash(testUserPassword, 12);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { email: testUserEmail },
        data: {
          firstName: 'Test',
          lastName: 'User',
          passwordHash: passwordHash,
          role: 'RISK_MANAGER',
          permissions: [
            'risks:read',
            'risks:write',
            'risks:delete',
            'controls:read',
            'controls:write',
            'controls:delete',
            'assessments:read',
            'assessments:write',
            'documents:read',
            'documents:write',
            'reports:read',
            'reports:write',
            'ai:access',
            'dashboard:access',
          ],
          isActive: true,
          emailVerified: new Date(),
          lastLogin: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: testUserEmail,
          firstName: 'Test',
          lastName: 'User',
          passwordHash: passwordHash,
          role: 'RISK_MANAGER',
          permissions: [
            'risks:read',
            'risks:write',
            'risks:delete',
            'controls:read',
            'controls:write',
            'controls:delete',
            'assessments:read',
            'assessments:write',
            'documents:read',
            'documents:write',
            'reports:read',
            'reports:write',
            'ai:access',
            'dashboard:access',
          ],
          isActive: true,
          emailVerified: new Date(),
          organizationId: organization.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: organization.name,
      },
      credentials: {
        email: testUserEmail,
        password: testUserPassword,
      },
    });
  } catch (error) {
    // console.error('Error creating test user:', error)
    return NextResponse.json(
      {
        error: 'Failed to create test user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
