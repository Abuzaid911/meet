import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        friends: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          }
        },
        receivedFriendRequests: {
          where: { status: 'pending' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                username: true,
              }
            }
          }
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
    return NextResponse.json(
      { error: 'Error fetching friends and requests' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { friends: true }
    })

    const friendUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    if (!friendUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.id === friendUser.id) {
      return NextResponse.json({ error: 'You cannot add yourself as a friend' }, { status: 400 })
    }

    // Check if they're already friends
    const alreadyFriends = currentUser.friends.some(friend => friend.id === friendUser.id)

    if (alreadyFriends) {
      return NextResponse.json({ error: 'You are already friends with this user' }, { status: 400 })
    }

    // Check for existing friend requests
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: friendUser.id },
          { senderId: friendUser.id, receiverId: currentUser.id }
        ]
      }
    })

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'A friend request already exists between these users' }, { status: 400 })
      } else if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'These users are already friends' }, { status: 400 })
      }
    }

    // Create new friend request
    await prisma.friendRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: friendUser.id,
        status: 'pending'
      },
    })

    return NextResponse.json({ message: 'Friend request sent successfully' })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Error sending friend request' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
    try {
      const session = await getServerSession(authOptions)
  
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { friendId } = await request.json()
  
      if (!friendId) {
        return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
      }
  
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
      })
  
      if (!currentUser) {
        return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
      }
  
      // Remove the friend connection in both directions
      await prisma.$transaction([
        prisma.user.update({
          where: { id: currentUser.id },
          data: {
            friends: {
              disconnect: { id: friendId }
            }
          }
        }),
        prisma.user.update({
          where: { id: friendId },
          data: {
            friends: {
              disconnect: { id: currentUser.id }
            }
          }
        })
      ])
  
      return NextResponse.json({ message: 'Friend removed successfully' })
    } catch (error) {
      console.error('Error removing friend:', error)
      return NextResponse.json({ error: 'Error removing friend' }, { status: 500 })
    }
  }