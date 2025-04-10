import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET: Fetch invitations for the authenticated user
 * This returns events where the user has a PENDING RSVP status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to view invitations' },
        { status: 401 }
      );
    }

    // Find all events where the user has a PENDING RSVP status
    const invitations = await prisma.attendee.findMany({
      where: {
        userId: session.user.id,
        rsvp: 'PENDING',
      },
      include: {
        event: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations. Please try again later.' },
      { status: 500 }
    );
  }
} 