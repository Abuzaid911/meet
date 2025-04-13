import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// GET individual photo
export async function GET(
  request: Request, 
) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("id");
  const photoId = searchParams.get("photoId");

  if (!eventId || !photoId) {
    return NextResponse.json({ error: "Missing event ID or photo ID" }, { status: 400 });
  }

  try {
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
export async function DELETE(
  request: Request,
) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("id");
  const photoId = searchParams.get("photoId");

  if (!eventId || !photoId) {
    return NextResponse.json({ error: "Missing event ID or photo ID" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    
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

    // Find the photo to get file path and check ownership
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

    // Get filename from the image URL
    const fileUrl = photo.imageUrl;
    const urlParts = fileUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    
    // Delete the file from disk
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "events", eventId);
      const filePath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // We continue even if file deletion fails, as the database record is already removed
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