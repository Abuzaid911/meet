import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, action } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 })
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true },
    })

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to perform this action' }, { status: 403 })
    }

    if (action === 'accept') {
      await prisma.$transaction([
        // Create the friendship connections
        prisma.user.update({
          where: { id: friendRequest.receiverId },
          data: { friends: { connect: { id: friendRequest.senderId } } },
        }),
        prisma.user.update({
          where: { id: friendRequest.senderId },
          data: { friends: { connect: { id: friendRequest.receiverId } } },
        }),
        // Delete the current request
        prisma.friendRequest.delete({
          where: { id: requestId },
        }),
        // Delete any other pending requests between these users
        prisma.friendRequest.deleteMany({
          where: {
            OR: [
              { senderId: friendRequest.senderId, receiverId: friendRequest.receiverId },
              { senderId: friendRequest.receiverId, receiverId: friendRequest.senderId }
            ]
          }
        })
      ])

      return NextResponse.json({ message: 'Friend request accepted and friendship created' })
    } else if (action === 'decline') {
      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: friendRequest.senderId, receiverId: friendRequest.receiverId },
            { senderId: friendRequest.receiverId, receiverId: friendRequest.senderId }
          ]
        }
      })

      return NextResponse.json({ message: 'Friend request declined and deleted' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error handling friend request:', error)
    return NextResponse.json({ error: 'Error handling friend request' }, { status: 500 })
  }
}

