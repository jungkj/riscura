import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' });
  }

  try {
    const { db } = await import('@/lib/db');

    // Check if user exists
    const user = await db.client.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    // Check if organization exists
    let org = null;
    if (!user) {
      const orgDomain = email.split('@')[1];
      org = await db.client.organization.findFirst({
        where: {
          OR: [{ domain: orgDomain }, { name: orgDomain }],
        },
      });
    }

    return NextResponse.json({
      userExists: !!user,
      organizationExists: !!user?.organization || !!org,
      userData: user
        ? {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            organizationId: user.organizationId,
            organizationName: user.organization?.name,
          }
        : null,
      suggestion: !user
        ? 'User does not exist. OAuth will create a new account.'
        : 'User exists. OAuth should update lastLogin and log them in.',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check user',
      suggestion: 'Check if database is accessible',
    });
  }
}
