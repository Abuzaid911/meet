import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma' 

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        friends: true,
        receivedFriendRequests: {
          where: { status: 'pending' },
          include: { sender: true }
        }
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      friends: currentUser.friends,
      pendingRequests: currentUser.receivedFriendRequests
    })
  } catch (error) {
    console.error('Error fetching friends and requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const friendUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!friendUser) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 })
    }

    if (currentUser.id === friendUser.id) {
      return NextResponse.json({ error: 'You cannot add yourself as a friend' }, { status: 400 })
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: currentUser.id,
        receiverId: friendUser.id,
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
    }

    // Create a new friend request
    await prisma.friendRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: friendUser.id,
        status: 'pending',
      },
    })

    return NextResponse.json({ message: 'Friend request sent successfully!' })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PUT: Accept or Decline a Friend Request
 */
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