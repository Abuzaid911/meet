// app/api/events/[id]/rsvp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define schema for RSVP validation
const rsvpSchema = z.object({
  rsvp: z.enum(['YES', 'NO', 'MAYBE', 'PENDING']),
});

/**
 * GET: Check current user's RSVP status for an event
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event details to check if it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        id: true, 
        name: true,
        hostId: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get user's current RSVP
    const attendance = await prisma.attendee.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    return NextResponse.json({
      isAttending: !!attendance,
      rsvp: attendance?.rsvp || null,
      eventName: event.name,
      isHost: event.hostId === session.user.id
    });
  } catch (error) {
    console.error('Error checking RSVP status:', error);
    return NextResponse.json({ error: 'Error checking RSVP status' }, { status: 500 });
  }
}

/**
 * POST: Create or update user's RSVP for an event
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = rsvpSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid RSVP status', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Get event details to check if it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }



    // Normal RSVP processing
    const updatedAttendee = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      update: { rsvp: validatedData.data.rsvp },
      create: {
        userId: session.user.id,
        eventId,
        rsvp: validatedData.data.rsvp,
      },
    });

    return NextResponse.json(updatedAttendee);
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ error: 'Error updating RSVP' }, { status: 500 });
  }
}

/**
 * DELETE: Remove RSVP (Cancel attendance)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if RSVP exists before deleting
    const existingRSVP = await prisma.attendee.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (!existingRSVP) {
      return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });
    }

    // Get event to check if it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete the RSVP
    await prisma.attendee.delete({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    // Since capacity is not implemented, we'll just delete the RSVP

    return NextResponse.json({ 
      message: 'Successfully removed attendance'
    });
  } catch (error) {
    console.error('Error removing RSVP:', error);
    return NextResponse.json({ error: 'Error removing RSVP' }, { status: 500 });
  }
}