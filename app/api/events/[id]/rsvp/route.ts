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
        capacity: true,
        rsvpDeadline: true,
        hostId: true,
        attendees: {
          where: { rsvp: 'YES' },
          select: { id: true }
        }
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

    // Check if event has passed RSVP deadline
    const now = new Date();
    const hasDeadlinePassed = event.rsvpDeadline && new Date(event.rsvpDeadline) < now;
    
    // Check if event is at capacity
    const isAtCapacity = event.capacity && event.attendees.length >= event.capacity;
    const isWaitlisted = attendance?.rsvp === 'MAYBE' && isAtCapacity;
    
    return NextResponse.json({
      isAttending: !!attendance,
      rsvp: attendance?.rsvp || null,
      eventName: event.name,
      isHost: event.hostId === session.user.id,
      eventDetails: {
        capacity: event.capacity,
        currentAttendees: event.attendees.length,
        isAtCapacity,
        rsvpDeadline: event.rsvpDeadline,
        hasDeadlinePassed,
        isWaitlisted
      }
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

    // Get event details to check capacity and deadline
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        capacity: true, 
        rsvpDeadline: true,
        attendees: {
          where: { rsvp: 'YES' },
          select: { id: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if RSVP deadline has passed
    if (event.rsvpDeadline && new Date(event.rsvpDeadline) < new Date()) {
      return NextResponse.json({ 
        error: 'RSVP deadline has passed',
        rsvpDeadline: event.rsvpDeadline
      }, { status: 400 });
    }

    // Check if event is at capacity and handle waitlist logic
    if (
      validatedData.data.rsvp === 'YES' && 
      event.capacity && 
      event.attendees.length >= event.capacity
    ) {
      // If the event is at capacity, add to waitlist instead
      const updatedAttendee = await prisma.attendee.upsert({
        where: {
          userId_eventId: {
            userId: session.user.id,
            eventId,
          },
        },
        update: { rsvp: 'MAYBE' }, // Use MAYBE for waitlist
        create: {
          userId: session.user.id,
          eventId,
          rsvp: 'MAYBE', // Use MAYBE for waitlist
        },
      });

      return NextResponse.json({
        ...updatedAttendee,
        waitlisted: true,
        message: 'Event is at capacity. You have been added to the waitlist.'
      });
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

    // Get event to check for RSVP deadline
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { rsvpDeadline: true }
    });

    if (event?.rsvpDeadline && new Date(event.rsvpDeadline) < new Date()) {
      return NextResponse.json({ 
        error: 'Cannot cancel RSVP after deadline',
        rsvpDeadline: event.rsvpDeadline
      }, { status: 400 });
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

    // If capacity exists and someone cancels a YES RSVP, promote from waitlist
    if (existingRSVP.rsvp === 'YES') {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { capacity: true }
      });

      if (event?.capacity) {
        // Find first waitlisted person (MAYBE status)
        const waitlistedAttendee = await prisma.attendee.findFirst({
          where: {
            eventId,
            rsvp: 'MAYBE'
          },
          orderBy: {
            createdAt: 'asc' // First come, first served
          }
        });

        if (waitlistedAttendee) {
          // Promote from waitlist
          await prisma.attendee.update({
            where: {
              id: waitlistedAttendee.id
            },
            data: {
              rsvp: 'YES'
            }
          });

          // Create notification for promoted user
          await prisma.notification.create({
            data: {
              message: `You've been promoted from the waitlist for an event: ${eventId}`,
              sourceType: 'ATTENDEE',
              attendeeId: waitlistedAttendee.id,
              targetUserId: waitlistedAttendee.userId
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      message: 'Successfully removed attendance'
    });
  } catch (error) {
    console.error('Error removing RSVP:', error);
    return NextResponse.json({ error: 'Error removing RSVP' }, { status: 500 });
  }
}