// app/api/events/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Enhanced schema validation for event creation
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  // For now, keep validating rsvpDeadline in the schema but don't store it
  rsvpDeadline: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid RSVP deadline format",
  }).optional(),
  inviteFriends: z.array(z.string()).optional()
})

/**
 * GET: Fetch upcoming events
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in to view events" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where = {
      date: {
        gte: new Date(),
      },
      ...(userId && { hostId: userId }),
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        date: "asc",
      },
      take: 10,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events. Please try again later." }, { status: 500 })
  }
}

/**
 * POST: Create a new event
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in to create events" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid event data", details: validatedData.error.format() }, { status: 400 })
    }

    const { 
      name, 
      date, 
      time, 
      location, 
      description, 
      duration, 
      rsvpDeadline, 
      inviteFriends = []
    } = validatedData.data

    const eventDate = new Date(date)
    if (eventDate < new Date()) {
      return NextResponse.json({ error: "Event date must be in the future" }, { status: 400 })
    }

    // Validate RSVP deadline is before event date if provided
    if (rsvpDeadline) {
      const deadlineDate = new Date(rsvpDeadline)
      if (deadlineDate > eventDate) {
        return NextResponse.json({ error: "RSVP deadline must be before event date" }, { status: 400 })
      }
    }

    // Create the event with only the fields that exist in the schema
    const event = await prisma.event.create({
      data: {
        name,
        date: eventDate,
        time,
        location,
        description,
        duration,
        hostId: session.user.id,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Automatically add the host as an attendee with "YES" RSVP
    await prisma.attendee.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
        rsvp: "YES",
      },
    })

    // Process friend invitations if any
    if (inviteFriends.length > 0) {
      // Verify these are actually friends
      const friendships = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          friends: {
            where: { id: { in: inviteFriends } },
          },
        },
      })

      if (friendships?.friends) {
        // Create attendee records for each friend with PENDING status
        await Promise.all(
          friendships.friends.map((friend) =>
            prisma.attendee.create({
              data: {
                userId: friend.id,
                eventId: event.id,
                rsvp: "PENDING",
              },
            })
          )
        )
      }
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}