import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

// GET /api/users/me - Get current user profile
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Basic authentication check
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from database
    const user = await db.client.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    // console.error('Get user profile error:', error)
    return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
  }
}

// PUT /api/users/me - Update user profile
export async function PUT(_request: NextRequest): Promise<NextResponse> {
  try {
    // Basic authentication check
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from database
    const user = await db.client.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const body = await request.json();
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
        organizationId: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    // console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}

// PATCH /api/users/me - Change password
export async function PATCH(_request: NextRequest): Promise<NextResponse> {
  try {
    // Basic authentication check
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from database
    const user = await db.client.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is a password change request
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
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
    })

    if (!currentUser || !currentUser.passwordHash) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password (simplified version)
    // In production, you would use proper password verification
    if (currentPassword !== 'demo-password') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password (simplified version)
    // In production, you would use proper password hashing
    const newPasswordHash = `hashed_${newPassword}`

    // Update password
    await db.client.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    // console.error('Change password error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
