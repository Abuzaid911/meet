import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get a sample event ID from the query parameter or use a recent event
    const { searchParams } = new URL(request.url);
    let eventId = searchParams.get('eventId');
    
    // If no event ID provided, fetch the most recent event
    if (!eventId) {
      const recentEvent = await prisma.event.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });
      
      if (recentEvent) {
        eventId = recentEvent.id;
      } else {
        return NextResponse.json({ error: "No events found in database" }, { status: 404 });
      }
    }
    
    console.log(`Testing event details and photos for event: ${eventId}`);
    
    // 1. Try to get the event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json({ 
        error: "Event not found", 
        requestedId: eventId 
      }, { status: 404 });
    }
    
    // 2. If event exists, try to get its photos
    const photos = await prisma.eventPhoto.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
    
    // 3. Return the combined results
    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        hostId: event.hostId,
      },
      photos: photos.map(photo => ({
        id: photo.id,
        imageUrl: photo.imageUrl,
        uploadedBy: photo.user ? photo.user.name || photo.user.username : 'Unknown',
      })),
      photosCount: photos.length,
    });
  } catch (error) {
    console.error('Error testing event photos:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error testing event photos',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 