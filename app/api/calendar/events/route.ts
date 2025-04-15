import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGoogleCalendarClient } from "../index";

/**
 * GET: Fetch personal calendar events for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters for date filtering
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }
    
    // Check if user has a Google access token
    if (!session.accessToken) {
      console.log("No Google access token available");
      return NextResponse.json([]);
    }
    
    try {
      // Get Google Calendar client
      const calendar = await getGoogleCalendarClient();
      
      // Fetch calendar events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      const events = response.data.items || [];
      console.log(`Found ${events.length} Google Calendar events`);
      
      // Transform Google Calendar events to our format
      const formattedEvents = events.map((event, index) => {
        // Get start date and time
        const start = event.start?.dateTime || event.start?.date;
        let date = '';
        let time = '';
        
        if (start) {
          const startDate = new Date(start);
          date = startDate.toISOString().split('T')[0];
          time = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
        
        return {
          id: event.id || `google-${index}`,
          title: event.summary || 'Untitled Event',
          date,
          time,
          location: event.location || '',
          description: event.description || '',
          source: 'google',
          htmlLink: event.htmlLink,
          // Use colorId to display different calendar colors
          colorId: event.colorId || '1'
        };
      });
      
      return NextResponse.json(formattedEvents);
    } catch (googleError) {
      console.error("Error fetching Google Calendar events:", googleError);
      // Return empty array instead of mock data
      return NextResponse.json([]);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in calendar events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: errorMessage },
      { status: 500 }
    );
  }
} 