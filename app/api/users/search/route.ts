// app/api/users/search/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint for searching users
 * Handles case-insensitive search by username or full name
 */
export async function GET(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and normalize the search query
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim().toLowerCase();

    // Return empty results for short queries
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Get current user's friends to exclude from results
    const userWithFriends = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { friends: { select: { id: true } } }
    });
    
    const friendIds = userWithFriends?.friends.map(friend => friend.id) || [];
    
    // Always exclude the current user from search results
    friendIds.push(session.user.id);

    // Get pending friend requests to mark their status
    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ],
        status: 'pending'
      },
      select: {
        senderId: true,
        receiverId: true
      }
    });

    // Create sets for quick lookups
    const pendingUserIds = new Set<string>();
    pendingRequests.forEach(request => {
      if (request.senderId !== session.user.id) pendingUserIds.add(request.senderId);
      if (request.receiverId !== session.user.id) pendingUserIds.add(request.receiverId);
    });

    // Search users by username or name (both case-insensitive)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        id: { notIn: friendIds }, // Exclude friends and current user
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
      take: 10, // Limit results
    });

    // Add relationship status to each result
    const usersWithStatus = users.map(user => ({
      ...user,
      status: pendingUserIds.has(user.id) ? 'pending' : 'none'
    }));

    return NextResponse.json({ 
      users: usersWithStatus,
      query
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}