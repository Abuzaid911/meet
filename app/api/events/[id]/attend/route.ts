import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ✅ RSVP validation schema
const rsvpSchema = z.object({
  rsvp: z.enum(["YES", "NO", "MAYBE"]),
});

/**
 * ✅ GET: Check if the user is attending an event
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params; // ✅ Awaiting params correctly

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      rsvp: attendance?.rsvp ?? "not attending",
    });
  } catch (error) {
    console.error("Error checking attendance:", error);
    return NextResponse.json({ error: "Error checking attendance" }, { status: 500 });
  }
}

/**
 * ✅ POST: RSVP to an event
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params; // ✅ Awaiting params correctly

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = rsvpSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid RSVP status", details: validatedData.error.format() }, { status: 400 });
    }

    // Ensure event exists before allowing RSVP
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const attendance = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      update: { rsvp: validatedData.data.rsvp },
      create: { userId: session.user.id, eventId, rsvp: validatedData.data.rsvp },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ error: "Error updating attendance" }, { status: 500 });
  }
}

/**
 * ✅ DELETE: Remove RSVP (Unattend event)
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params; // ✅ Awaiting params correctly

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    await prisma.attendee.delete({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    return NextResponse.json({ message: "Successfully removed attendance" });
  } catch (error) {
    console.error("Error removing attendance:", error);
    return NextResponse.json({ error: "Error removing attendance" }, { status: 500 });
  }
}