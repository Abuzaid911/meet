import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, generateFileKey } from "@/lib/cloudflare-r2";

/**
 * GET /api/events/[id]/photos
 * Returns all photos for an event
 */
export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Extract the eventId from the pathname since it's a dynamic route
    const parts = pathname.split('/');
    const eventId = parts[parts.indexOf('events') + 1];

    console.log(`Fetching photos for event: ${eventId}`);

    if (!eventId) {
      console.log('Missing event ID in request');
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    // Check if event exists
    console.log('Looking up event in database');
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      console.log(`Event not found: ${eventId}`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch photos for this event
    console.log(`Event found, fetching photos for: ${eventId}`);
    try {
      const photos = await prisma.eventPhoto.findMany({
        where: { eventId },
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
        orderBy: { uploadedAt: "desc" },
      });
      
      console.log(`Found ${photos.length} photos for event ${eventId}`);
      return NextResponse.json(photos);
    } catch (dbError) {
      console.error("Database error fetching photos:", dbError);
      return NextResponse.json(
        { error: "Database error fetching photos", details: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching event photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/photos
 * Upload a new photo to an event
 */
export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Extract the eventId from the pathname since it's a dynamic route
    const parts = pathname.split('/');
    const eventId = parts[parts.indexOf('events') + 1];

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to upload photos" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find the event to make sure it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Process form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const caption = formData.get("caption") as string || "";

    if (!photo) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (photo.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique key for R2
    const key = generateFileKey(`events/${eventId}`, userId, photo.name);

    // Upload to R2
    const imageUrl = await uploadToR2(buffer, key, photo.type);

    // Create photo record in database
    const newPhoto = await prisma.eventPhoto.create({
      data: {
        imageUrl,
        caption,
        userId,
        eventId,
      },
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
    });

    return NextResponse.json(newPhoto);
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/photos
 * For future implementation - delete a photo
 */