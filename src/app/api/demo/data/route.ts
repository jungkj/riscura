import { NextRequest, NextResponse } from 'next/server';
import { getDemoData, getTestUserByEmail, hasPermission } from '@/lib/demo/testUser';
import { isDemoModeEnabled, isDevelopmentEnvironment } from '@/config/env';

// GET /api/demo/data - Get demo data for testing
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Only allow in development or demo mode
    if (!isDevelopmentEnvironment() && !isDemoModeEnabled()) {
      return NextResponse.json(
        { error: 'Demo data only available in development mode' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const dataType = url.searchParams.get('type');
    const userEmail = url.searchParams.get('user');

    // Get complete demo data
    const demoData = getDemoData();

    // If specific data type requested, return only that type
    if (dataType) {
      switch (dataType) {
        case 'risks':
          return NextResponse.json({
            success: true,
            data: demoData.risks,
            meta: {
              total: demoData.risks.length,
              type: 'risks',
            },
          });

        case 'controls':
          return NextResponse.json({
            success: true,
            data: demoData.controls,
            meta: {
              total: demoData.controls.length,
              type: 'controls',
            },
          });

        case 'documents':
          return NextResponse.json({
            success: true,
            data: demoData.documents,
            meta: {
              total: demoData.documents.length,
              type: 'documents',
            },
          });

        case 'metrics':
          return NextResponse.json({
            success: true,
            data: demoData.dashboardMetrics,
            meta: {
              type: 'metrics',
            },
          });

        case 'users':
          return NextResponse.json({
            success: true,
            data: demoData.users.map((user) => ({
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              profile: user.profile,
              lastLogin: user.lastLogin,
            })),
            meta: {
              total: demoData.users.length,
              type: 'users',
            },
          });

        case 'organization':
          return NextResponse.json({
            success: true,
            data: demoData.organization,
            meta: {
              type: 'organization',
            },
          });

        default:
          return NextResponse.json({ error: `Unknown data type: ${dataType}` }, { status: 400 });
      }
    }

    // Filter data based on user permissions if user is specified
    if (userEmail) {
      const user = getTestUserByEmail(userEmail);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Filter based on permissions
      const filteredData = {
        ...demoData,
        risks: hasPermission(user.id, 'risks:read') ? demoData.risks : [],
        controls: hasPermission(user.id, 'controls:read') ? demoData.controls : [],
        documents: hasPermission(user.id, 'documents:read') ? demoData.documents : [],
        dashboardMetrics: hasPermission(user.id, 'dashboard:read')
          ? demoData.dashboardMetrics
          : null,
      };

      return NextResponse.json({
        success: true,
        data: filteredData,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
        meta: {
          filtered: true,
          userRole: user.role,
        },
      });
    }

    // Return all demo data
    return NextResponse.json({
      success: true,
      data: demoData,
      meta: {
        total: {
          users: demoData.users.length,
          risks: demoData.risks.length,
          controls: demoData.controls.length,
          documents: demoData.documents.length,
        },
        organization: demoData.organization.name,
        demoMode: true,
      },
    });
  } catch (error) {
    // console.error('Demo data API error:', error)
    return NextResponse.json({ error: 'Failed to retrieve demo data' }, { status: 500 });
  }
}

// POST /api/demo/data - Simulate data operations for testing
export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    if (!isDevelopmentEnvironment() && !isDemoModeEnabled()) {
      return NextResponse.json(
        { error: 'Demo operations only available in development mode' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, type, data, userId } = body;

    // Validate user
    const user = userId ? getTestUserByEmail(userId) : null;

    switch (action) {
      case 'create':
        // Simulate creating new item
        const newItem = {
          id: `demo_${type}_${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: user?.id || 'demo_user',
        };

        return NextResponse.json({
          success: true,
          message: `${type} created successfully (demo mode)`,
          data: newItem,
        });

      case 'update':
        // Simulate updating item
        const updatedItem = {
          ...data,
          updatedAt: new Date(),
        };

        return NextResponse.json({
          success: true,
          message: `${type} updated successfully (demo mode)`,
          data: updatedItem,
        });

      case 'delete':
        // Simulate deleting item
        return NextResponse.json({
          success: true,
          message: `${type} deleted successfully (demo mode)`,
          deletedId: data.id,
        });

      case 'analyze':
        // Simulate AI analysis
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing time

        const analysisResult = {
          summary: `AI analysis completed for ${type}`,
          insights: [
            'Risk score calculated based on impact and likelihood',
            'Recommended mitigation strategies identified',
            'Compliance requirements mapped',
          ],
          recommendations: [
            'Implement additional security controls',
            'Review and update policies',
            'Conduct regular risk assessments',
          ],
          confidence: 0.85,
          processedAt: new Date(),
        };

        return NextResponse.json({
          success: true,
          message: 'AI analysis completed (demo mode)',
          data: analysisResult,
        });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    // console.error('Demo operation error:', error)
    return NextResponse.json({ error: 'Demo operation failed' }, { status: 500 });
  }
}
