// app/api/events/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
  headerImageUrl: z.string().optional()
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where = {
      date: {
        gte: new Date(),
      },
      OR: [
        { hostId: userId || undefined },
        {
          attendees: {
            some: {
              userId: userId || undefined,
              rsvp: { in: ['YES', 'MAYBE'] as ('YES' | 'MAYBE')[] }
            }
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
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
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
      rsvpDeadline: date // Using event date as RSVP deadline for now
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
    if (headerType === 'image' && headerImage && headerImage instanceof File) {
      try {
        console.log('Processing header image file:', headerImage.name, headerImage.size, headerImage.type);
        
        const imageExt = headerImage.name.split('.').pop() || 'png'
        const fileName = `event-${uuidv4()}.${imageExt}`
        const publicDir = path.join(process.cwd(), 'public')
        const uploadsDir = path.join(publicDir, 'uploads')
        
        console.log('Checking if uploads directory exists:', uploadsDir);
        
        // Make sure uploads directory exists
        try {
          await import('fs').then(async fs => {
            if (!fs.existsSync(uploadsDir)) {
              console.log('Creating uploads directory');
              await import('fs/promises').then(async fsp => {
                await fsp.mkdir(uploadsDir, { recursive: true });
              });
            }
          });
        } catch (dirError) {
          console.error('Error creating uploads directory:', dirError);
          throw new Error('Failed to create uploads directory');
        }
        
        const filePath = path.join(uploadsDir, fileName)
        console.log('Writing file to:', filePath);
        
        const buffer = Buffer.from(await headerImage.arrayBuffer())
        await writeFile(filePath, buffer)
        
        headerImageUrl = `/uploads/${fileName}`
        console.log('Successfully saved image to:', headerImageUrl);
      } catch (error) {
        console.error('Error saving image:', error);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return NextResponse.json({ error: "Failed to save image" }, { status: 500 })
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
          headerImageUrl
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
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
            friends: {
              where: { id: { in: inviteFriends } },
            },
          },
        })

        if (friendships?.friends) {
          // Create attendee records for each friend with PENDING status
          await Promise.all(
            friendships.friends.map((friend) =>
              prisma.attendee.create({
                data: {
                  userId: friend.id,
                  eventId: event.id,
                  rsvp: "PENDING",
                },
              })
            )
          )
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