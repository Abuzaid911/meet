import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch app events for the calendar view
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession(request);
    const userId = session?.user?.id;
    
    // Get query parameters for date filtering
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const filter = searchParams.get("filter");
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }
    
    // Convert date strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log(`Fetching events from ${start.toISOString()} to ${end.toISOString()}`);
    
    // Fix for potential date issues
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    try {
      // If user is not logged in, we can only show public events
      if (!userId) {
        const publicEvents = await prisma.event.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            privacyLevel: "PUBLIC"
          },
          select: {
            id: true,
            name: true,
            date: true,
            time: true,
            duration: true,
            location: true,
            headerImageUrl: true,
            headerColor: true,
            host: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            attendees: {
              where: {
                rsvp: 'YES'
              },
              select: {
                id: true
              }
            }
          },
          orderBy: {
            date: "asc",
          },
        });
        
        const formattedEvents = publicEvents.map(event => ({
          ...event,
          attendingCount: event.attendees.length,
          attendees: undefined, // Remove attendees array
        }));
        
        return NextResponse.json(formattedEvents);
      }
      
      // For logged-in users, filter events based on the filter parameter
      
      // Filter specifically for events the user is invited to and RSVP'd YES or MAYBE
      if (filter === "invited-rsvp") {
        const invitedEvents = await prisma.event.findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            OR: [
              // Events the user is hosting
              { hostId: userId },
              // Events where the user has RSVP'd YES or MAYBE
              {
                attendees: {
                  some: { 
                    userId,
                    rsvp: { in: ['YES', 'MAYBE'] }
                  }
                }
              }
            ]
          },
          select: {
            id: true,
            name: true,
            date: true,
            time: true,
            duration: true,
            location: true,
            headerImageUrl: true,
            headerColor: true,
            host: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            attendees: {
              select: {
                id: true,
                rsvp: true,
                userId: true
              }
            }
          },
          orderBy: {
            date: "asc",
          },
        });
        
        // Format the events to include user's own RSVP status and attending count
        const formattedEvents = invitedEvents.map(event => {
          const userAttendee = event.attendees.find(a => a.userId === userId);
          const yesCount = event.attendees.filter(a => a.rsvp === 'YES').length;
          
          return {
            ...event,
            userRsvp: userAttendee?.rsvp || null,
            attendingCount: yesCount,
            // Keep the attendees array for the event carousel
            attendees: event.attendees.map(a => ({
              user: {
                id: a.userId,
                name: null,
                image: null
              },
              rsvp: a.rsvp
            }))
          };
        });
        
        console.log(`Found ${formattedEvents.length} events where user is invited/attending`);
        return NextResponse.json(formattedEvents);
      }
      
      // Default filter - standard calendar view (public events + user's own events + events they're attending)
      const events = await prisma.event.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
          OR: [
            { privacyLevel: "PUBLIC" },
            { hostId: userId },
            {
              attendees: {
                some: { 
                  userId,
                  rsvp: 'YES'
                }
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          date: true,
          time: true,
          duration: true,
          location: true,
          headerImageUrl: true,
          headerColor: true,
          host: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          attendees: {
            where: {
              rsvp: 'YES'
            },
            select: {
              id: true
            }
          }
        },
        orderBy: {
          date: "asc",
        },
      });
      
      console.log(`Found ${events.length} app events`);
      
      // Transform events to add attendee count
      const formattedEvents = events.map(event => ({
        ...event,
        attendingCount: event.attendees.length,
        attendees: undefined, // Remove attendees array
      }));
      
      return NextResponse.json(formattedEvents);
    } catch (dbError) {
      console.error("Database error fetching events:", dbError);
      return NextResponse.json(
        { error: "Database error", details: (dbError as Error).message },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: errorMessage },
      { status: 500 }
    );
  }
} 