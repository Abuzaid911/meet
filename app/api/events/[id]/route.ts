// Updated schema validation in app/api/events/route.ts
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
  capacity: z.number().min(1).optional(),
  rsvpDeadline: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid RSVP deadline format",
  }).optional(),
  timeZone: z.string().optional(), // Add time zone support
  inviteFriends: z.array(z.string()).optional(), // Optional array of friend IDs to invite
})

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
      capacity, 
      rsvpDeadline,
      inviteFriends = []
    } = validatedData.data

    const eventDate = new Date(date)
    if (eventDate < new Date()) {
      return NextResponse.json({ error: "Event date must be in the future" }, { status: 400 })
    }

    // Validate RSVP deadline is before event date
    if (rsvpDeadline) {
      const deadlineDate = new Date(rsvpDeadline)
      if (deadlineDate > eventDate) {
        return NextResponse.json({ error: "RSVP deadline must be before event date" }, { status: 400 })
      }
    }

    // Create the event with new fields
    const event = await prisma.event.create({
      data: {
        name,
        date: eventDate,
        time,
        location,
        description,
        duration,
        capacity: capacity || null,
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        hostId: session.user.id,
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
            select: { id: true }
          }
        }
      })

      const validFriendIds = friendships?.friends.map(f => f.id) || []

      // Create pending RSVP for each valid friend
      if (validFriendIds.length > 0) {
        await Promise.all(
          validFriendIds.map(friendId =>
            prisma.attendee.create({
              data: {
                userId: friendId,
                eventId: event.id,
                rsvp: "PENDING",
              }
            })
          )
        )

        // Create notifications for invited friends
        await Promise.all(
          validFriendIds.map(friendId =>
            prisma.notification.create({
              data: {
                message: `You've been invited to an event: ${name}`,
                link: `/events/${event.id}`,
                sourceType: "ATTENDEE",
                targetUserId: friendId
              }
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