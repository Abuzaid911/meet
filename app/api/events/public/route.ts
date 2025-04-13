import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: new Date(),
        },
        privacyLevel: "PUBLIC" // Only show public events
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
            username: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        },
      },
    })

    // Process events to ensure all required fields are present
    const processedEvents = events.map(event => {
      // Create a safe copy of the event with all required fields
      const safeEvent = {
        ...event,
        // Ensure lat and lng are always defined with proper numeric values
        lat: event.lat ?? 0,
        lng: event.lng ?? 0,
        // Ensure host has all required fields
        host: {
          ...event.host,
          username: event.host.username || event.host.name?.toLowerCase().replace(/\s+/g, '') || 'user',
        },
        // Ensure attendees have all required fields
        attendees: event.attendees.map(attendee => ({
          ...attendee,
          user: {
            ...attendee.user,
            username: attendee.user.username || attendee.user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
          }
        }))
      }
      
      return safeEvent
    })

    return NextResponse.json(processedEvents)
  } catch (error) {
    console.error('Error fetching public events:', error)
    return NextResponse.json({ error: 'Error fetching events' }, { status: 500 })
  }
}