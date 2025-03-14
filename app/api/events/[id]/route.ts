import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema validation for attendee RSVP
const addAttendeeSchema = z.object({
  email: z.string().email(),
  rsvp: z.enum(["YES", "NO", "MAYBE"]),
});

/**
 * GET: Fetch event details by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await the params to extract the 'id'
    const { id } = await context.params;

    // Fetch the event by ID
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: { include: { user: true } },
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Error fetching event' },
      { status: 500 }
    );
  }
}

/**
 * POST: Add an attendee to an event
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: eventId } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addAttendeeSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid input", details: validatedData.error.format() }, { status: 400 });
    }

    const { email, rsvp } = validatedData.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const attendee = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
      update: { rsvp },
      create: {
        userId: user.id,
        eventId,
        rsvp,
      },
    });

    return NextResponse.json(attendee);
  } catch (error) {
    console.error("Error adding attendee:", error);
    return NextResponse.json({ error: "Error adding attendee" }, { status: 500 });
  }
}

/**
 * DELETE: Delete an event
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const userId = session.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to delete this event" },
        { status: 403 }
      );
    }

    // Delete all related records first
    await prisma.$transaction([
      // Delete all comments for this event
      prisma.comment.deleteMany({
        where: { eventId },
      }),
      // Delete all attendees for this event
      prisma.attendee.deleteMany({
        where: { eventId },
      }),
      // Delete the event itself
      prisma.event.delete({
        where: { id: eventId },
      }),
    ]);

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an event
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const body = await request.json();
    
    // First check if the user is the event host
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to update this event" },
        { status: 403 }
      );
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name: body.name,
        date: body.date ? new Date(body.date) : undefined,
        time: body.time,
        location: body.location,
        description: body.description,
        duration: body.duration,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Error updating event" }, { status: 500 });
  }
}