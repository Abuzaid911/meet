import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationSourceType } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise to extract the 'id'
    const { id } = await context.params;

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
      include: { host: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Use a transaction to create both attendee and notification
    const result = await prisma.$transaction(async (tx) => {
      const attendee = await tx.attendee.create({
        data: {
          userId: user.id,
          eventId: id,
          rsvp: 'PENDING',
        },
      });

      const notification = await tx.notification.create({
        data: {
          message: `${event.host.name || event.host.username} invited you to ${event.name}`,
          link: `/events/${id}`,
          sourceType: NotificationSourceType.ATTENDEE,
          targetUserId: user.id,
          attendeeId: attendee.id
        },
      });

      return { attendee, notification };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding attendee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}