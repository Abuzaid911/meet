// app/api/user/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

    // Create a unique filename
    const fileExtension = file.type.split('/')[1];
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Ensure the uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Write the file to the server
    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Create the public URL for the image
    const imageUrl = `/uploads/${fileName}`;
    
    // Update the user's profile with the new image URL
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
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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