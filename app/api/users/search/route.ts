import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Search API endpoint - Finds users by username or name
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();

    // Return empty results if no query provided
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Find existing friend IDs for current user to exclude them from results
    const friendships = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { friends: { select: { id: true } } }
    });
    
    const friendIds = friendships?.friends.map(friend => friend.id) || [];
    // Always exclude the current user from results
    friendIds.push(session.user.id);

    // Get pending friend request IDs (both sent and received)
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

    // Extract unique user IDs from pending requests
    const pendingUserIds = new Set<string>();
    pendingRequests.forEach(request => {
      if (request.senderId !== session.user.id) pendingUserIds.add(request.senderId);
      if (request.receiverId !== session.user.id) pendingUserIds.add(request.receiverId);
    });

    // Perform search on both username and name
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
      orderBy: [
        // Sort results by relevance - exact matches first
        // Note: Using standard Prisma sorting capabilities
        { username: 'asc' }
      ],
      take: 10, // Limit results
    });

    // Annotate results with relationship status
    const usersWithStatus = users.map(user => ({
      ...user,
      status: pendingUserIds.has(user.id) ? 'pending' : 'none'
    }));

    return NextResponse.json({ 
      users: usersWithStatus,
      query: query
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}