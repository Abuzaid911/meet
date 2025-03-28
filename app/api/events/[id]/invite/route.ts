import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust the import based on your project structure

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

    // Add the attendee to the event
    const attendee = await prisma.attendee.create({
      data: {
        userId: user.id,
        eventId: id,
        rsvp: 'PENDING', // Default RSVP status
      },
    });

    return NextResponse.json(attendee, { status: 201 });
  } catch (error) {
    console.error('Error adding attendee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}