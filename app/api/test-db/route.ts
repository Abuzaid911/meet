import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection by querying a simple count
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. User count: ${userCount}`);
    
    // Test event photo table
    console.log('Testing event photo table access...');
    const photoCount = await prisma.eventPhoto.count();
    console.log(`Successfully queried event photos. Count: ${photoCount}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      counts: {
        users: userCount,
        photos: photoCount
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection test failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 