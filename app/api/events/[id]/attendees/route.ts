import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define possible RSVP values
const rsvpSchema = z.object({
  rsvp: z.enum(['YES', 'NO', 'MAYBE']),
});

/**
 * POST: Invite a user to an event
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure RSVP is assigned a value (default: 'Pending')
    const attendee = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        eventId: id,
        rsvp: 'PENDING', // Default value for RSVP
      },
    });

    return NextResponse.json(attendee);
  } catch (error) {
    console.error('Error inviting attendee:', error);
    return NextResponse.json(
      { error: 'Error inviting attendee' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: { include: { user: true } }, // ✅ Include attendees
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Error fetching event" }, { status: 500 });
  }
}

/**
 * ✅ PATCH: Update RSVP status
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