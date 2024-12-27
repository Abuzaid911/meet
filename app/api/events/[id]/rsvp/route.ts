import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rsvp } = await request.json()

    if (!['Yes', 'No', 'Maybe'].includes(rsvp)) {
      return NextResponse.json({ error: 'Invalid RSVP status' }, { status: 400 })
    }

    const updatedAttendee = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: params.id,
        },
      },
      update: { rsvp },
      create: {
        userId: session.user.id,
        eventId: params.id,
        rsvp,
      },
    })

    return NextResponse.json(updatedAttendee)
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json({ error: 'Error updating RSVP' }, { status: 500 })
  }
}

