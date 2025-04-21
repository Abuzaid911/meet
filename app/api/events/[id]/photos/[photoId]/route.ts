import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/cloudflare-r2";
import { getStorageKey } from "@/lib/models/event-photo";

// GET individual photo
export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Extract the eventId and photoId from the pathname
    const parts = pathname.split('/');
    const eventId = parts[parts.indexOf('events') + 1];
    const photoId = parts[parts.length - 1];

    if (!eventId || !photoId) {
      return NextResponse.json({ error: "Missing event ID or photo ID" }, { status: 400 });
    }

    // Find the event to make sure it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Find the specific photo
    const photo = await prisma.eventPhoto.findUnique({
      where: {
        id: photoId,
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

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

// DELETE photo
export async function DELETE(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    // Extract the eventId and photoId from the pathname
    const parts = pathname.split('/');
    const eventId = parts[parts.indexOf('events') + 1];
    const photoId = parts[parts.length - 1];

    if (!eventId || !photoId) {
      return NextResponse.json({ error: "Missing event ID or photo ID" }, { status: 400 });
    }

    const session = await auth.api.getSession(request);
    
    // Check if user is logged in
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to delete photos" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find the event to check ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Find the photo to get storage key and check ownership
    const photo = await prisma.eventPhoto.findUnique({
      where: {
        id: photoId,
        eventId,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check if user is either the event host or the photo uploader
    const isEventHost = event.hostId === userId;
    const isPhotoOwner = photo.userId === userId;

    if (!isEventHost && !isPhotoOwner) {
      return NextResponse.json(
        { error: "You don't have permission to delete this photo" },
        { status: 403 }
      );
    }

    // Delete the photo from the database
    await prisma.eventPhoto.delete({
      where: {
        id: photoId,
      },
    });

    // Get storage key - either from the field or extract from URL
    const storageKey = getStorageKey(photo);
    
    if (storageKey) {
      try {
        await deleteFromR2(storageKey);
      } catch (deleteError) {
        // Log error but don't fail the request
        console.error("Error deleting file from R2:", deleteError);
      }
    }

    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}