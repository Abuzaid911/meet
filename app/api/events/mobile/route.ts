// Mobile-specific endpoint for events that uses JWT token for authentication
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

/**
 * GET: Fetch upcoming events for mobile clients using JWT token
 */
export async function GET(request: Request) {
  try {
    // Extract the token from Authorization header or query parameter
    const authHeader = request.headers.get("Authorization")
    const url = new URL(request.url)
    const queryToken = url.searchParams.get("sessionToken")
    
    // Use either the Authorization header or query parameter
    const token = authHeader?.replace("Bearer ", "") || queryToken
    
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.log("Mobile API: Received token, validating...")
    
    // Verify the JWT token
    let decoded: {
      sub?: string;
      user?: {
        id: string;
        name: string;
        email: string;
        image: string;
      };
    }
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
        sub?: string;
        user?: {
          id: string;
          name: string;
          email: string;
          image: string;
        };
      }
    } catch (error) {
      console.log("Token validation error:", error)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    // Extract user ID from the token
    const userId = decoded?.user?.id || decoded?.sub
    
    if (!userId) {
      console.log("No user ID in token")
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }
    
    console.log("Mobile API: Token validated, user ID:", userId)
    
    // Find user's friends for the friends-only privacy setting
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        friends: { select: { id: true } }
      }
    })
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Extract friend IDs for easier filtering
    const friendIds = currentUser.friends.map(friend => friend.id)
    
    // Build where clause based on privacy and userId
    const where = {
      date: {
        gte: new Date(),
      },
      OR: [
        // Events the user is hosting
        { hostId: userId },
        
        // Events the user is attending (with YES or MAYBE response)
        {
          attendees: {
            some: {
              userId: userId,
              rsvp: { in: ['YES', 'MAYBE'] as ('YES' | 'MAYBE')[] }
            }
          }
        },
        
        // Public events
        { privacyLevel: "PUBLIC" },
        
        // Friends-only events where current user is friends with the host
        {
          privacyLevel: "FRIENDS_ONLY",
          hostId: { in: friendIds }
        },
        
        // Private events where current user is specifically invited
        {
          privacyLevel: "PRIVATE",
          attendees: {
            some: { userId }
          }
        }
      ]
    }
    
    const events = await prisma.event.findMany({
      where,
      orderBy: {
        date: "asc",
      },
      take: 10,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        },
      },
    })
    
    console.log(`Mobile API: Found ${events.length} events for user ${userId}`)
    return NextResponse.json(events)
    
  } catch (error) {
    console.error("Mobile API error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch events",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 