import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ✅ RSVP validation schema
const rsvpSchema = z.object({
  rsvp: z.enum(["Yes", "No", "Maybe"]),
});

/**
 * ✅ POST: Update RSVP status for an event
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
    const validatedData = rsvpSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({
        error: "Invalid RSVP status",
        details: validatedData.error.format(),
      }, { status: 400 });
    }

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
    console.error("Error updating RSVP:", error);
    return NextResponse.json({ error: "Error updating RSVP" }, { status: 500 });
  }
}