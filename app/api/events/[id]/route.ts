import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema validation for attendee RSVP
const addAttendeeSchema = z.object({
  email: z.string().email(),
  rsvp: z.enum(["YES", "NO", "MAYBE"]),
});

/**
 * GET: Fetch event details by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Await the params to extract the 'id'
    const { id } = await context.params;

    // Fetch the event by ID
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: { include: { user: true } },
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if the user has permission to view this event
    // Allow if user is the host or if the event is public
    if (!currentUserId) {
      // If not logged in, only allow viewing public events
      if (event.privacyLevel !== "PUBLIC") {
        return NextResponse.json({ error: 'You must be logged in to view this event' }, { status: 401 });
      }
    } else if (event.hostId !== currentUserId) {
      // Check privacy level if user is not the host
      if (event.privacyLevel === "PRIVATE") {
        // For private events, check if user is invited
        const isInvited = event.attendees.some(attendee => attendee.user.id === currentUserId);
        if (!isInvited) {
          return NextResponse.json({ error: 'You do not have permission to view this private event' }, { status: 403 });
        }
      } else if (event.privacyLevel === "FRIENDS_ONLY") {
        // For friends-only events, check if user is a friend of the host
        const hostUser = await prisma.user.findUnique({
          where: { id: event.hostId },
          include: {
            friends: {
              where: { id: currentUserId },
              select: { id: true }
            }
          }
        });
        
        const isFriend = hostUser?.friends.some(friend => friend.id === currentUserId) || false;
        
        // Allow if user is invited or is a friend
        const isInvited = event.attendees.some(attendee => attendee.user.id === currentUserId);
        
        if (!isFriend && !isInvited) {
          return NextResponse.json({ error: 'This event is only visible to friends of the host' }, { status: 403 });
        }
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Error fetching event' },
      { status: 500 }
    );
  }
}

/**
 * POST: Add an attendee to an event
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: eventId } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addAttendeeSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid input", details: validatedData.error.format() }, { status: 400 });
    }

    const { email, rsvp } = validatedData.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const attendee = await prisma.attendee.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
      update: { rsvp },
      create: {
        userId: user.id,
        eventId,
        rsvp,
      },
    });

    return NextResponse.json(attendee);
  } catch (error) {
    console.error("Error adding attendee:", error);
    return NextResponse.json({ error: "Error adding attendee" }, { status: 500 });
  }
}

/**
 * Extract storage key from image URL
 */
function extractKeyFromUrl(imageUrl: string): string | null {
  try {
    // For Cloudflare R2 URLs: https://public-url.com/event-headers/userId-timestamp.ext
    // We want: event-headers/userId-timestamp.ext
    const url = new URL(imageUrl);
    return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
  } catch (error) {
    console.error("Failed to extract storage key from URL:", error);
    return null;
  }
}

/**
 * DELETE: Delete an event
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const userId = session.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        hostId: true,
        headerType: true,
        headerImageUrl: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to delete this event" },
        { status: 403 }
      );
    }

    // Delete the header image from R2 if it exists
    if (event.headerType === "image" && event.headerImageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/cloudflare-r2");
        const key = extractKeyFromUrl(event.headerImageUrl);
        if (key) {
          await deleteFromR2(key);
        }
      } catch (deleteError) {
        // Log but continue with event deletion
        console.error("Error deleting event header image:", deleteError);
      }
    }

    // Delete all related records first
    await prisma.$transaction([
      // Delete all comments for this event
      prisma.comment.deleteMany({
        where: { eventId },
      }),
      // Delete all attendees for this event
      prisma.attendee.deleteMany({
        where: { eventId },
      }),
      // Delete the event itself
      prisma.event.delete({
        where: { id: eventId },
      }),
    ]);

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an event
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    
    // Handle FormData for file uploads
    const formData = await request.formData();
    
    // Extract fields from formData
    const name = formData.get('name') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string || undefined;
    const duration = parseInt(formData.get('duration') as string || '0');
    const headerType = formData.get('headerType') as 'color' | 'image';
    const headerColor = headerType === 'color' ? formData.get('headerColor') as string : undefined;
    const headerImage = headerType === 'image' ? formData.get('headerImage') : null;
    const privacyLevel = formData.get('privacyLevel') as string || 'PUBLIC';
    
    // First check if the user is the event host and get current event data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        hostId: true,
        headerType: true,
        headerImageUrl: true,
        privacyLevel: true
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to update this event" },
        { status: 403 }
      );
    }

    // Track if privacy level has changed
    const privacyChanged = event.privacyLevel !== privacyLevel;
    
    // Prepare update data
    const updateData: {
      name: string;
      date?: Date;
      time: string;
      location: string;
      description?: string;
      duration: number;
      headerColor?: string;
      headerType?: string;
      headerImageUrl?: string;
      privacyLevel: string;
      privacyChanged?: Date;
    } = {
      name,
      time,
      location,
      description,
      duration,
      privacyLevel,
    };
    
    // Add date if valid
    if (date) {
      try {
        updateData.date = new Date(date);
      } catch {
        // Ignore the error variable since we're not using it
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
    }

    // Add privacy changed timestamp if privacy level changed
    if (privacyChanged) {
      updateData.privacyChanged = new Date();
      
      // If going from more private to more public, send notifications to newly eligible users
      if (
        (event.privacyLevel === 'PRIVATE' && (privacyLevel === 'FRIENDS_ONLY' || privacyLevel === 'PUBLIC')) ||
        (event.privacyLevel === 'FRIENDS_ONLY' && privacyLevel === 'PUBLIC')
      ) {
        // We'll implement the notification logic here later
        console.log('Privacy level upgraded, should notify users');
      }
    }
    
    // Handle header color if needed
    if (headerType === 'color') {
      updateData.headerColor = headerColor;
      updateData.headerImageUrl = undefined; // Clear image URL when switching to color
    }

    // Process new header image if provided
    if (headerType === 'image' && headerImage) {
      try {
        // Check if it's a proper file object
        if (headerImage && typeof headerImage === 'object' && 'arrayBuffer' in headerImage) {
          // Delete old image if header type was already image
          if (event.headerType === 'image' && event.headerImageUrl) {
            try {
              const { deleteFromR2 } = await import('@/lib/cloudflare-r2');
              const oldKey = extractKeyFromUrl(event.headerImageUrl);
              if (oldKey) {
                await deleteFromR2(oldKey);
              }
            } catch (deleteError) {
              console.error('Error deleting old header image:', deleteError);
              // Continue with upload even if delete fails
            }
          }
          
          // Upload new image
          const buffer = Buffer.from(await headerImage.arrayBuffer());
          const { uploadToR2, generateFileKey } = await import('@/lib/cloudflare-r2');
          
          // Generate a unique key for the image
          const key = generateFileKey('event-headers', session.user.id, 
            (headerImage as File).name || `event-image-${Date.now()}.png`);
          
          // Upload to R2
          const imageUrl = await uploadToR2(
            buffer, 
            key, 
            (headerImage as File).type || 'image/png'
          );
          
          updateData.headerImageUrl = imageUrl;
        } else if (headerType === 'image' && !headerImage && event.headerImageUrl) {
          // Keep existing image URL if no new image provided
          updateData.headerImageUrl = event.headerImageUrl;
        }
      } catch (uploadError) {
        console.error('Error uploading header image:', uploadError);
        return NextResponse.json({ error: 'Failed to upload header image' }, { status: 500 });
      }
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: "Error updating event" }, { status: 500 });
  }
}