// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch a user profile along with upcoming events and friendship status
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = context.params.id;
    const currentUserId = session.user.id;
    
    // Check if the requested user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        events: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: {
            date: "asc",
          },
          take: 5,
          select: {
            id: true,
            name: true,
            date: true,
            time: true,
            location: true,
          }
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check friendship status
    let friendStatus: 'none' | 'pending' | 'friends' = 'none';
    
    // Check if users are friends
    const friendship = await prisma.user.findFirst({
      where: {
        id: currentUserId,
        friends: {
          some: {
            id: userId
          }
        }
      }
    });
    
    if (friendship) {
      friendStatus = 'friends';
    } else {
      // Check for pending friend requests
      const pendingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ],
          status: 'pending'
        }
      });
      
      if (pendingRequest) {
        friendStatus = 'pending';
      }
    }

    // Enhanced response with friendship status
    const enhancedResponse = {
      ...user,
      friendStatus
    };

    return NextResponse.json(enhancedResponse);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Error fetching user profile" }, { status: 500 });
  }
}