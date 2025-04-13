// app/api/events/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createEventInvitationNotification } from "@/lib/notification-service"
// Cloudflare R2 utilities are dynamically imported when needed

// Enhanced schema validation for event creation
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  duration: z.number().int().min(1, "Duration must be at least 1 minute"),
  // For now, keep validating rsvpDeadline in the schema but don't store it
  rsvpDeadline: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid RSVP deadline format",
  }).optional(),
  inviteFriends: z.array(z.string()).optional(),
  headerType: z.enum(["color", "image"]),
  headerColor: z.string().optional(),
  headerImageUrl: z.string().optional(),
  privacyLevel: z.enum(["PUBLIC", "FRIENDS_ONLY", "PRIVATE"]).default("PUBLIC")
})

/**
 * GET: Fetch upcoming events
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in to view events" }, { status: 401 })
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get("userId")
    
    // If a specific user's events are requested, use that, otherwise use the current user's ID
    const targetUserId = requestedUserId || userId;
    
    // Find user's friends for the friends-only privacy setting
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        friends: { select: { id: true } }
      }
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Extract friend IDs for easier filtering
    const friendIds = currentUser.friends.map(friend => friend.id);
    
    // Build where clause based on privacy and userId
    const where = {
      date: {
        gte: new Date(),
      },
      OR: [
        // Events the target user is hosting
        { hostId: targetUserId },
        
        // Events the target user is attending (with YES or MAYBE response)
        {
          attendees: {
            some: {
              userId: targetUserId,
              rsvp: { in: ['YES', 'MAYBE'] as ('YES' | 'MAYBE')[] }
            }
          }
        },
        
        // If viewing all events (not just a specific user's events)
        ...(targetUserId === userId ? [
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
        ] : [])
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

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events. Please try again later." }, { status: 500 })
  }
}

/**
 * POST: Create a new event
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in to create events" }, { status: 401 })
    }

    // Handle FormData
    const formData = await request.formData()
    
    // Extract fields from formData
    const name = formData.get('name') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const location = formData.get('location') as string
    const description = formData.get('description') as string || undefined
    const privacyLevel = formData.get('privacyLevel') as string || "PUBLIC"
    
    // For all-day events, set a default duration
    let duration: number;
    if (time === "ALL_DAY") {
      duration = 1440; // 24 hours in minutes (all day)
    } else {
      const durationValue = formData.get('duration');
      if (durationValue === null || durationValue === "") {
        duration = 30; // Default 30 minutes if missing
      } else {
        duration = parseInt(durationValue as string);
        // Make sure duration is valid
        if (isNaN(duration) || duration <= 0) {
          duration = 30; // Fallback to 30 minutes
        }
      }
    }
    
    const headerType = formData.get('headerType') as 'color' | 'image'
    const headerColor = headerType === 'color' ? formData.get('headerColor') as string : undefined
    const headerImage = headerType === 'image' ? formData.get('headerImage') as File : undefined
    
    // Define headerImageUrl before using it
    let headerImageUrl: string | undefined = undefined
    
    // Extract friends array from FormData
    const inviteFriends: string[] = []
    formData.getAll('inviteFriends[]').forEach(friend => {
      if (typeof friend === 'string') {
        inviteFriends.push(friend)
      }
    })

    // Normalize time format for all-day events
    const normalizedTime = time === "ALL_DAY" ? "00:00" : time;

    // Validate data using the schema
    const dataToValidate = {
      name,
      date,
      time: normalizedTime, // Use normalized time for validation
      location,
      description,
      duration,
      headerType,
      headerColor,
      headerImageUrl,
      inviteFriends: inviteFriends || [],
      rsvpDeadline: date, // Using event date as RSVP deadline for now
      privacyLevel
    }
    
    const validation = createEventSchema.safeParse(dataToValidate);
    if (!validation.success) {
      console.error("Validation error:", validation.error.format());
      return NextResponse.json({ 
        error: "Invalid event data", 
        details: validation.error.format(),
        data: dataToValidate // Include the data that was validated for easier debugging
      }, { status: 400 })
    }
    
    // Process headerImage if present
    if (headerType === 'image' && headerImage) {
      try {
        console.log('Processing header image');
        
        // In server-side environment, we need to check in a different way since File is browser-specific
        if (headerImage && typeof headerImage === 'object' && 'arrayBuffer' in headerImage) {
          const buffer = Buffer.from(await headerImage.arrayBuffer());
          
          // Import the Cloudflare R2 utilities
          const { uploadToR2, generateFileKey } = await import('@/lib/cloudflare-r2');
          
          // Generate a unique key for the image
          const key = generateFileKey('event-headers', session.user.id, 
            headerImage.name || `event-image-${Date.now()}.png`);
          
          // Upload to R2
          headerImageUrl = await uploadToR2(
            buffer, 
            key, 
            headerImage.type || 'image/png'
          );
          
          console.log('Successfully uploaded image to R2:', headerImageUrl);
        } else {
          console.error('Invalid headerImage format:', headerImage);
          return NextResponse.json({ error: "Invalid header image format" }, { status: 400 });
        }
      } catch (error) {
        console.error('Error uploading image to R2:', error);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
      }
    }

    const eventDate = new Date(date)
    if (eventDate < new Date()) {
      return NextResponse.json({ error: "Event date must be in the future" }, { status: 400 })
    }

    try {
      // Create the event with the header options
      const event = await prisma.event.create({
        data: {
          name,
          date: eventDate,
          time: normalizedTime, // Store normalized time in database
          location,
          description,
          duration,
          hostId: session.user.id,
          headerType,
          headerColor,
          headerImageUrl,
          privacyLevel,
          privacyChanged: new Date() // Track when privacy was set
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
        },
      })

      // Automatically add the host as an attendee with "YES" RSVP
      await prisma.attendee.create({
        data: {
          userId: session.user.id,
          eventId: event.id,
          rsvp: "YES",
        },
      })

      // Process friend invitations if any
      if (inviteFriends.length > 0) {
        // Verify these are actually friends
        const friendships = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            username: true,
            friends: {
              where: { id: { in: inviteFriends } },
              select: { 
                id: true,
                name: true
              },
            },
          },
        })

        if (friendships?.friends) {
          // Create attendee records for each friend with PENDING status
          const attendeeCreations = await Promise.all(
            friendships.friends.map(async (friend) => {
              // Create the attendee record first
              const attendee = await prisma.attendee.create({
                data: {
                  userId: friend.id,
                  eventId: event.id,
                  rsvp: "PENDING",
                  inviteMethod: privacyLevel === "PRIVATE" ? "private_invite" : "direct",
                },
              });
              
              // Send notification using the notification service
              await createEventInvitationNotification({
                eventId: event.id,
                eventName: event.name,
                attendeeId: attendee.id,
                targetUserId: friend.id,
                hostName: friendships.name || friendships.username || "The host",
                privacyLevel: privacyLevel as "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE",
              });
              
              return attendee;
            })
          );
          
          // Log success
          console.log(`Created ${attendeeCreations.length} attendee records with notifications`);
        }
      }

      return NextResponse.json(event)
    } catch (dbError) {
      console.error("Database error creating event:", dbError);
      console.error('Error details:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)));
      return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}