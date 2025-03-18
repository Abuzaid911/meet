// app/api/friends/request/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST: Send a friend request to another user
 * Accepts either username or userId in the request body
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, userId } = await request.json();
    
    // We need either username or userId
    if (!username && !userId) {
      return NextResponse.json({ error: 'Username or userId is required' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the friend user by ID or username
    let friendUser;
    if (userId) {
      friendUser = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else {
      // Case-insensitive search by username
      friendUser = await prisma.user.findFirst({
        where: { 
          username: { 
            equals: username,
            mode: 'insensitive'  // Make it case-insensitive
          }
        },
      });
    }

    if (!friendUser) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    if (currentUser.id === friendUser.id) {
      return NextResponse.json({ error: 'You cannot add yourself as a friend' }, { status: 400 });
    }

    // Check if they're already friends
    const existingFriendship = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
        friends: {
          some: {
            id: friendUser.id
          }
        }
      }
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'You are already friends with this user' }, { status: 400 });
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { 
            senderId: currentUser.id,
            receiverId: friendUser.id
          },
          { 
            senderId: friendUser.id,
            receiverId: currentUser.id
          }
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        // If the other person already sent a request, accept it
        if (existingRequest.senderId === friendUser.id) {
          await prisma.$transaction([
            // Create the friendship connections
            prisma.user.update({
              where: { id: existingRequest.receiverId },
              data: { friends: { connect: { id: existingRequest.senderId } } },
            }),
            prisma.user.update({
              where: { id: existingRequest.senderId },
              data: { friends: { connect: { id: existingRequest.receiverId } } },
            }),
            // Delete the request
            prisma.friendRequest.delete({
              where: { id: existingRequest.id },
            })
          ]);

          // Create a notification for the new friend
          await prisma.notification.create({
            data: {
              message: `${currentUser.name || currentUser.username} accepted your friend request`,
              link: `/profile?tab=friends`,
              sourceType: 'FRIEND_REQUEST',
              targetUserId: friendUser.id
            }
          });

          return NextResponse.json({ 
            message: 'Friend request accepted automatically', 
            status: 'accepted' 
          });
        }
        
        return NextResponse.json({ 
          error: 'Friend request already sent',
          status: 'pending'
        }, { status: 400 });
      }
    }

    // Create a new friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: friendUser.id,
        status: 'pending',
      },
    }).catch((error) => {
      console.error('Database error creating friend request:', error);
      throw new Error('Failed to create friend request');
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Failed to create friend request' }, { status: 500 });
    }

    // Create a notification for the request recipient
    await prisma.notification.create({
      data: {
        message: `${currentUser.name || currentUser.username} sent you a friend request`,
        link: `/profile?tab=friends`,
        sourceType: 'FRIEND_REQUEST',
        targetUserId: friendUser.id,
        friendRequestId: friendRequest.id
      }
    }).catch((error) => {
      console.error('Database error creating notification:', error);
      // Don't throw here, as the friend request was already created
      console.warn('Friend request created but notification failed');
    });

    return NextResponse.json({ 
      message: 'Friend request sent successfully!',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET: Fetch friend requests and existing friends
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        friends: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        receivedFriendRequests: {
          where: { status: 'pending' },
          include: { 
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      friends: currentUser.friends,
      pendingRequests: currentUser.receivedFriendRequests
    });
  } catch (error) {
    console.error('Error fetching friends and requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT: Accept or Decline a Friend Request
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to perform this action' }, { status: 403 });
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
      ]);

      // Create a notification for the request sender
      await prisma.notification.create({
        data: {
          message: `${friendRequest.receiver.name || friendRequest.receiver.username} accepted your friend request`,
          link: `/profile?tab=friends`,
          sourceType: 'FRIEND_REQUEST',
          targetUserId: friendRequest.senderId
        }
      });

      return NextResponse.json({ message: 'Friend request accepted and friendship created' });
    } else if (action === 'decline') {
      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: friendRequest.senderId, receiverId: friendRequest.receiverId },
            { senderId: friendRequest.receiverId, receiverId: friendRequest.senderId }
          ]
        }
      });

      return NextResponse.json({ message: 'Friend request declined and deleted' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling friend request:', error);
    return NextResponse.json({ error: 'Error handling friend request' }, { status: 500 });
  }
}