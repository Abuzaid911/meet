import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ✅ Schema validation for attendee RSVP
const addAttendeeSchema = z.object({
  email: z.string().email(),
  rsvp: z.enum(["Yes", "No", "Maybe"]),
});

/**
 * ✅ POST: Add an attendee to an event
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ `params` as a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: eventId } = await params; // ✅ Awaiting params correctly

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params; // Awaiting the params promise
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

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}