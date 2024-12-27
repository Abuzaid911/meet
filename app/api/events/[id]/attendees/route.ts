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

    const { email, rsvp } = await request.json()

    if (!email || !['Yes', 'No', 'Maybe'].includes(rsvp)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const attendee = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: params.id,
        },
      },
      update: { rsvp },
      create: {
        userId: user.id,
        eventId: params.id,
        rsvp,
      },
    })

    return NextResponse.json(attendee)
  } catch (error) {
    console.error('Error adding attendee:', error)
    return NextResponse.json({ error: 'Error adding attendee' }, { status: 500 })
  }
}

