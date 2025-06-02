import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { hashPassword, checkPasswordStrength } from '@/lib/auth/password';

// Profile update schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

// Password change schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Get current user profile - with demo mode fallback
export async function GET(req: NextRequest) {
  try {
    console.log('=== /api/users/me DEBUG ===');
    console.log('Authorization header:', req.headers.get('authorization'));
    console.log('Demo user cookie:', req.cookies.get('demo-user')?.value);
    console.log('Refresh token cookie:', req.cookies.get('refreshToken')?.value);
    
    // Check for demo authentication first - prioritize demo mode
    const demoUserCookie = req.cookies.get('demo-user')?.value;
    const authHeader = req.headers.get('authorization');
    
    console.log('Demo check conditions:');
    console.log('- Has demo cookie:', !!demoUserCookie);
    console.log('- Demo cookie content:', demoUserCookie);
    
    // If demo cookie exists, always use demo mode regardless of auth header
    if (demoUserCookie) {
      console.log('Taking demo authentication path');
      try {
        const demoUser = JSON.parse(demoUserCookie);
        console.log('Parsed demo user:', demoUser);
        
        return NextResponse.json({
          user: {
            id: demoUser.id,
            email: demoUser.email,
            firstName: 'Demo',
            lastName: 'User',
            avatar: null,
            role: demoUser.role,
            permissions: demoUser.permissions || ['*'],
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
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // In demo mode with no database, return demo user data
      if (process.env.MOCK_DATA === 'true' || !process.env.DATABASE_URL) {
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

      // Get full user profile with organization details
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
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user: userProfile,
      });
    })(req);

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update user profile
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

    // Log profile update
    // NOTE: Activity logging for user events is temporarily disabled  
    // since USER is not a valid EntityType in the schema
    console.log('User Activity:', {
      type: 'PROFILE_UPDATED',
      userId: user.id,
      description: 'User updated their profile',
      metadata: { updatedFields: Object.keys(updateData) },
      organizationId: user.organizationId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
});

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