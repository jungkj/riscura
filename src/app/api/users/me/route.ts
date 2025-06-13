import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest, getAuthenticatedUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { productionGuard, throwIfProduction } from '@/lib/security/production-guard';
import { sanitizeObject } from '@/lib/security/input-sanitizer';
import { createSecureAPIHandler, SECURITY_PROFILES } from '@/lib/security/middleware-integration';
import { hashPassword, checkPasswordStrength } from '@/lib/auth/password';

// Profile update schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional().nullable(),
});

// Password change schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Get user profile with security hardening
export const GET = createSecureAPIHandler(async (req: NextRequest) => {
  try {
    console.log('🔍 Starting user profile retrieval');
    console.log('Demo user cookie:', req.cookies.get('demo-user')?.value);
    console.log('Refresh token cookie:', req.cookies.get('refreshToken')?.value);
    
    // DEVELOPMENT ONLY: Check for demo authentication - BLOCKED IN PRODUCTION
    const demoUserCookie = req.cookies.get('demo-user')?.value;
    const authHeader = req.headers.get('authorization');
    
    console.log('Demo check conditions:');
    console.log('- Has demo cookie:', !!demoUserCookie);
    console.log('- Demo cookie content:', demoUserCookie);
    
    // SECURITY: Block demo authentication in production
    if (productionGuard.isProduction() && demoUserCookie) {
      productionGuard.logSecurityEvent('blocked_demo_auth_production', {
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        path: '/api/users/me'
      });
      
      return NextResponse.json(
        { error: 'Demo authentication is not available in production' },
        { status: 403 }
      );
    }

    // DEVELOPMENT ONLY: Demo mode authentication
    if (!productionGuard.isProduction() && productionGuard.isDemoMode() && demoUserCookie) {
      throwIfProduction('Demo authentication in user profile');
      
      console.log('Taking demo authentication path');
      try {
        const demoUser = JSON.parse(demoUserCookie);
        console.log('Parsed demo user:', demoUser);
        
        // Validate demo user structure
        if (!demoUser.id || !demoUser.email || !demoUser.role) {
          throw new Error('Invalid demo user data structure');
        }
        
        // Sanitize demo user data
        const sanitizedDemoUser = sanitizeObject(demoUser, 'strict');
        
        return NextResponse.json({
          user: {
            id: sanitizedDemoUser.id,
            email: sanitizedDemoUser.email,
            firstName: 'Demo',
            lastName: 'User',
            avatar: null,
            role: sanitizedDemoUser.role,
            permissions: sanitizedDemoUser.permissions || ['*'],
            isActive: true,
            emailVerified: new Date(),
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            organizationId: 'demo-org-id',
            organization: {
              id: 'demo-org-id',
              name: 'Demo Organization',
              domain: 'demo.riscura.com',
              plan: 'ENTERPRISE',
              settings: {},
              isActive: true,
            },
          },
        });
      } catch (parseError) {
        console.error('Failed to parse demo user cookie:', parseError);
        productionGuard.logSecurityEvent('invalid_demo_user_cookie', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        
        return NextResponse.json(
          { error: 'Invalid demo session' },
          { status: 401 }
        );
      }
    }

    console.log('Taking regular auth middleware path');
    // Use regular authentication middleware for non-demo users
    return withAuth(async (req: AuthenticatedRequest) => {
      console.log('Inside withAuth middleware');
      const user = getAuthenticatedUser(req);
      console.log('Authenticated user:', user);
      
      if (!user) {
        productionGuard.logSecurityEvent('user_profile_not_found', {
          userId: user?.id || 'unknown'
        });
        
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // DEVELOPMENT ONLY: Mock data mode - BLOCKED IN PRODUCTION
      if (productionGuard.isProduction() && (process.env.MOCK_DATA === 'true' || !process.env.DATABASE_URL)) {
        productionGuard.logSecurityEvent('blocked_mock_data_production', {
          userId: user.id,
          mockDataEnabled: process.env.MOCK_DATA === 'true',
          noDatabaseUrl: !process.env.DATABASE_URL
        });
        
        return NextResponse.json(
          { error: 'Invalid configuration for production environment' },
          { status: 500 }
        );
      }

      // DEVELOPMENT ONLY: Mock data for development
      if (!productionGuard.isProduction() && (process.env.MOCK_DATA === 'true' || !process.env.DATABASE_URL)) {
        console.log('Using mock data for authenticated user');
        
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName || 'Demo',
            lastName: user.lastName || 'User',
            avatar: null,
            role: user.role,
            permissions: user.permissions || ['*'],
            isActive: true,
            emailVerified: new Date(),
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            organizationId: user.organizationId || 'demo-org-id',
            organization: {
              id: user.organizationId || 'demo-org-id',
              name: 'Demo Organization',
              domain: 'demo.riscura.com',
              plan: 'ENTERPRISE',
              settings: {},
              isActive: true,
            },
          },
        });
      }

      // Production database query with enhanced security
      try {
        const userProfile = await db.client.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            permissions: true,
            isActive: true,
            emailVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                domain: true,
                plan: true,
                settings: true,
                isActive: true,
              },
            },
          },
        });

        if (!userProfile) {
          productionGuard.logSecurityEvent('user_profile_not_found_db', {
            userId: user.id
          });
          
          return NextResponse.json(
            { error: 'User profile not found' },
            { status: 404 }
          );
        }

        // Sanitize user profile data before returning
        const sanitizedProfile = sanitizeObject(userProfile, 'basic');

        productionGuard.logSecurityEvent('user_profile_accessed', {
          userId: user.id,
          organizationId: userProfile.organizationId
        });

        return NextResponse.json({
          user: sanitizedProfile,
        });

      } catch (dbError) {
        productionGuard.logSecurityEvent('user_profile_db_error', {
          userId: user.id,
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        });

        return NextResponse.json(
          { error: 'Failed to retrieve user profile' },
          { status: 500 }
        );
      }
    })(req);

  } catch (error) {
    console.error('Get profile error:', error);
    productionGuard.logSecurityEvent('user_profile_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}, SECURITY_PROFILES.authenticated);

// Update user profile with enhanced security
export const PUT = createSecureAPIHandler(withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      productionGuard.logSecurityEvent('unauthorized_profile_update', {
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // SECURITY: Block profile updates in demo mode for production
    if (productionGuard.isProduction() && user.id.startsWith('demo-')) {
      productionGuard.logSecurityEvent('blocked_demo_profile_update', {
        userId: user.id,
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { error: 'Demo profiles cannot be updated in production' },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Sanitize input before validation
    const sanitizedBody = sanitizeObject(body, 'strict');
    
    const validationResult = updateProfileSchema.safeParse(sanitizedBody);

    if (!validationResult.success) {
      productionGuard.logSecurityEvent('invalid_profile_update_data', {
        userId: user.id,
        errors: validationResult.error.errors
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // DEVELOPMENT ONLY: Mock data mode
    if (!productionGuard.isProduction() && (process.env.MOCK_DATA === 'true' || !process.env.DATABASE_URL)) {
      console.log('Mock profile update for user:', user.id);
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: updateData.firstName || user.firstName,
          lastName: updateData.lastName || user.lastName,
          avatar: updateData.avatar || null,
          role: user.role,
          permissions: user.permissions,
          organizationId: user.organizationId,
          updatedAt: new Date(),
          organization: {
            id: user.organizationId || 'demo-org-id',
            name: 'Demo Organization',
          },
        },
      });
    }

    // Production database update with enhanced security
    try {
      const updatedUser = await db.client.user.update({
        where: { id: user.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          permissions: true,
          organizationId: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Sanitize response data
      const sanitizedUser = sanitizeObject(updatedUser, 'basic');

      productionGuard.logSecurityEvent('user_profile_updated', {
        userId: user.id,
        updatedFields: Object.keys(updateData),
        organizationId: user.organizationId
      });

      return NextResponse.json({
        user: sanitizedUser,
      });

    } catch (dbError) {
      productionGuard.logSecurityEvent('user_profile_update_db_error', {
        userId: user.id,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });

      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Update profile error:', error);
    productionGuard.logSecurityEvent('user_profile_update_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}), SECURITY_PROFILES.authenticated);

// Change password endpoint
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Check if this is a password change request
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const validationResult = changePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get current user with password hash
    const currentUser = await db.client.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!currentUser || !currentUser.passwordHash) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const { verifyPassword } = await import('@/lib/auth/password');
    const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Check new password strength
    const passwordStrength = checkPasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { 
          error: 'New password does not meet requirements',
          details: passwordStrength.feedback,
        },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await db.client.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Log password change
    // NOTE: Activity logging for user events is temporarily disabled
    // since USER is not a valid EntityType in the schema
    console.log('User Activity:', {
      type: 'PASSWORD_CHANGED',
      userId: user.id,
      description: 'User changed their password',
      organizationId: user.organizationId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}); 