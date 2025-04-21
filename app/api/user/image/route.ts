// app/api/user/image/route.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2, deleteFromR2, generateFileKey } from '@/lib/cloudflare-r2';

/**
 * Extract storage key from image URL
 */
function extractKeyFromUrl(imageUrl: string): string | null {
  try {
    // For Cloudflare R2 URLs: https://public-url.com/profile-images/userId-timestamp.ext
    // We want: profile-images/userId-timestamp.ext
    const url = new URL(imageUrl);
    return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
  } catch (error) {
    console.error("Failed to extract storage key from URL:", error);
    return null;
  }
}

/**
 * Handler for uploading a profile image
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the FormData from the request
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are supported' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Get current user to check for existing profile image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // If user has an existing profile image, delete it from R2
    if (user?.image) {
      const oldKey = extractKeyFromUrl(user.image);
      if (oldKey) {
        try {
          await deleteFromR2(oldKey);
        } catch (deleteError) {
          // Log but continue with upload
          console.error("Error deleting old profile image:", deleteError);
        }
      }
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique key for R2
    const key = generateFileKey('profile-images', session.user.id, file.name);
    
    // Upload to R2
    const imageUrl = await uploadToR2(buffer, key, file.type);
    
    // Update the user's profile with the R2 URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
      },
    });

    return NextResponse.json({ 
      message: 'Profile image updated successfully',
      image: imageUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json({ error: 'Error uploading profile image' }, { status: 500 });
  }
}

/**
 * Handler for removing a profile image
 */
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the current user to find their image URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Delete the image from R2 if it exists
    if (user?.image) {
      const storageKey = extractKeyFromUrl(user.image);
      if (storageKey) {
        try {
          await deleteFromR2(storageKey);
        } catch (deleteError) {
          // Log error but continue with removing from database
          console.error("Error deleting profile image from R2:", deleteError);
        }
      }
    }

    // Update the user's profile to remove the image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
      },
    });

    return NextResponse.json({
      message: 'Profile image removed successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json({ error: 'Error removing profile image' }, { status: 500 });
  }
}