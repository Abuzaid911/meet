// app/api/events/[id]/rsvp/route.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from 'next/server';
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
    
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event details to check if it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        id: true, 
        name: true,
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

    return NextResponse.json({
      isAttending: !!attendance,
      rsvp: attendance?.rsvp || null,
      eventName: event.name,
      isHost: event.hostId === session.user.id,
      eventDetails: {
        currentAttendees: event.attendees.length,
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
    
    const session = await auth.api.getSession(request);
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
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        hostId: true,
        capacity: true,
        attendees: {
          where: { rsvp: 'YES' },
          select: { id: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check capacity before allowing YES RSVP
    if (validatedData.data.rsvp === 'YES' && event.capacity) {
      const currentAttendees = event.attendees.length;
      if (currentAttendees >= event.capacity) {
        return NextResponse.json({ 
          error: 'Event has reached maximum capacity',
          details: { currentAttendees, capacity: event.capacity }
        }, { status: 400 });
      }
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

    // Create notification for event host if this is not a "PENDING" RSVP
    // and the user is not the host
    if (validatedData.data.rsvp !== 'PENDING' && event.hostId !== session.user.id) {
      // Get user's name for the notification message
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, username: true }
      });

      const displayName = user?.name || user?.username || 'Someone';
      
      let message;
      switch (validatedData.data.rsvp) {
        case 'YES':
          message = `${displayName} is going to your event: ${event.name}`;
          break;
        case 'MAYBE':
          message = `${displayName} might attend your event: ${event.name}`;
          break;
        case 'NO':
          message = `${displayName} can't attend your event: ${event.name}`;
          break;
        default:
          message = `${displayName} responded to your event: ${event.name}`;
      }

      await prisma.notification.create({
        data: {
          message,
          link: `/events/${eventId}`,
          sourceType: 'ATTENDEE',
          targetUserId: event.hostId,
          attendeeId: updatedAttendee.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedAttendee,
      message: 'RSVP updated successfully'
    });
  } catch (dbError) {
    console.error('Database error while updating RSVP:', dbError);
    return NextResponse.json({ 
      error: 'Failed to update RSVP status',
      details: 'There was an error processing your request'
    }, { status: 500 });
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
    
    const session = await auth.api.getSession(request);
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

    // Create notification for the event host if the canceller is not the host
    if (event.hostId !== session.user.id) {
      await prisma.notification.create({
        data: {
          message: `A user has canceled their RSVP for: ${event.name}`,
          link: `/events/${eventId}`,
          sourceType: 'ATTENDEE',
          targetUserId: event.hostId
        }
      });
    }

    return NextResponse.json({ 
      message: 'Successfully removed attendance'
    });
  } catch (error) {
    console.error('Error removing RSVP:', error);
    return NextResponse.json({ error: 'Error removing RSVP' }, { status: 500 });
  }
}