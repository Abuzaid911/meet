import { auth } from "@/lib/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Extract username from URL path
    const pathname = request.url.split('/');
    const username = pathname[pathname.length - 1];
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const session = await auth.api.getSession(request);
    const currentUserId = session?.user?.id;

    // Fetch user by username 
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Default friendship status
    let friendStatus = 'none';
    let isCurrentUser = false;

    // If we have a logged in user, determine relationship
    if (currentUserId) {
      // Check if this is the current user's profile
      isCurrentUser = currentUserId === user.id;

      if (!isCurrentUser) {
        // Check if they are friends - using the self-relation in User model
        const userWithFriends = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: {
            friends: {
              where: { id: user.id },
              select: { id: true }
            }
          }
        });

        if (userWithFriends && userWithFriends.friends && userWithFriends.friends.length > 0) {
          friendStatus = 'friends';
        } else {
          // Check for pending friend requests
          const outgoingRequest = await prisma.friendRequest.findFirst({
            where: {
              senderId: currentUserId,
              receiverId: user.id,
            },
          });

          if (outgoingRequest) {
            friendStatus = 'pending_outgoing';
          }

          const incomingRequest = await prisma.friendRequest.findFirst({
            where: {
              senderId: user.id,
              receiverId: currentUserId,
            },
          });

          if (incomingRequest) {
            friendStatus = 'pending_incoming';
          }
        }
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        isCurrentUser,
        friendStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}