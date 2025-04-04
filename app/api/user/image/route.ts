// app/api/user/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Handler for uploading a profile image
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
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

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'profile-images',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    // Update the user's profile with the Cloudinary URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
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
      image: result.secure_url,
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
export async function DELETE() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the current user to find their image URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    if (user?.image) {
      // Extract public_id from Cloudinary URL
      const publicId = user.image.split('/').slice(-1)[0].split('.')[0];
      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(`profile-images/${publicId}`);
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