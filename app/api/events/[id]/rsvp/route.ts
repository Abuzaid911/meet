import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define possible RSVP values
const rsvpSchema = z.object({
  rsvp: z.enum(['Yes', 'No', 'Maybe']),
});

/**
 * PATCH: Update RSVP status
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await the params to extract the 'id'
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = rsvpSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid RSVP status',
          details: validatedData.error.format(),
        },
        { status: 400 }
      );
    }

    // Ensure RSVP is updated correctly
    const updatedAttendee = await prisma.attendee.update({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: id,
        },
      },
      data: {
        rsvp: validatedData.data.rsvp,
      },
    });

    return NextResponse.json(updatedAttendee);
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { error: 'Error updating RSVP' },
      { status: 500 }
    );
  }
}