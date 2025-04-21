import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEventInvitationNotification } from '@/lib/notification-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise to extract the 'id'
    const { id } = await context.params;
    
    // Get the current user session
    const session = await auth.api.getSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Find the user by username
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get event details for the notification
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        hostId: true,
        host: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        privacyLevel: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Make sure the current user is the host
    if (event.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Only the event host can invite users' }, { status: 403 });
    }

    // Use a transaction to create attendee
    const attendee = await prisma.attendee.create({
      data: {
        userId: user.id,
        eventId: id,
        rsvp: 'PENDING',
        inviteMethod: event.privacyLevel === "PRIVATE" ? "private_invite" : "direct",
      },
    });

    // Create notification using our notification service
    const notificationResult = await createEventInvitationNotification({
      eventId: id,
      eventName: event.name,
      attendeeId: attendee.id,
      targetUserId: user.id,
      hostName: event.host.name || event.host.username || 'The host',
      privacyLevel: event.privacyLevel as "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE",
    });

    return NextResponse.json({
      success: true,
      attendee,
      notification: notificationResult.success ? 'Notification sent' : 'Notification failed'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding attendee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}