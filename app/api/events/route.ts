import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Validation types
interface CreateEventPayload {
  name: string
  date: string
  time: string
  location: string
  description?: string
}

// Validation function
function validateEventPayload(data: unknown): data is CreateEventPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as CreateEventPayload).name === 'string' &&
    (data as CreateEventPayload).name.trim().length > 0 &&
    typeof (data as CreateEventPayload).date === 'string' &&
    !isNaN(new Date((data as CreateEventPayload).date).getTime()) &&
    typeof (data as CreateEventPayload).time === 'string' &&
    (data as CreateEventPayload).time.trim().length > 0 &&
    typeof (data as CreateEventPayload).location === 'string' &&
    (data as CreateEventPayload).location.trim().length > 0 &&
    ((data as CreateEventPayload).description === undefined ||
      typeof (data as CreateEventPayload).description === 'string')
  );
}


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view events' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Base query for upcoming events
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: 'asc',
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
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events. Please try again later.' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to create events' }, 
        { status: 401 }
      )
    }

    const payload = await request.json()

    // Validate payload
    if (!validateEventPayload(payload)) {
      return NextResponse.json(
        { error: 'Invalid event data provided' }, 
        { status: 400 }
      )
    }

    const { name, date, time, location, description } = payload

    // Additional date validation
    const eventDate = new Date(date)
    if (eventDate < new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' }, 
        { status: 400 }
      )
    }

    // Create the event with sanitized data
    const event = await prisma.event.create({
      data: { 
        name: name.trim(), 
        date: eventDate, 
        time: time.trim(), 
        location: location.trim(), 
        description: description?.trim(), 
        hostId: session.user.id 
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        attendees: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'An event with these details already exists' }, 
          { status: 409 }
        )
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid user or reference data provided' }, 
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create event. Please try again later.' }, 
      { status: 500 }
    )
  }
}