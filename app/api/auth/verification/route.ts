import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the verification record type
type Verification = {
  id: string;
  identifier: string;
  value: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// This route will create verification records in a format compatible with better-auth
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Extract required fields from the request
    const { id, identifier, value, expiresAt } = data;
    
    if (!id || !identifier || !value || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a verification record with all required fields using raw SQL
    // This avoids TypeScript errors with the Prisma client
    await prisma.$executeRaw`
      INSERT INTO verification (id, identifier, value, token, "expiresAt", "createdAt", "updatedAt")
      VALUES (
        ${id},
        ${identifier},
        ${value},
        ${'placeholder_token'},
        ${new Date(expiresAt)},
        ${new Date()},
        ${new Date()}
      )
    `;
    
    // Query the record we just created
    const verifications = await prisma.$queryRaw<Verification[]>`
      SELECT * FROM verification WHERE id = ${id} LIMIT 1
    `;
    
    const verification = verifications[0];
    
    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error creating verification:', error);
    return NextResponse.json(
      { error: 'Failed to create verification' },
      { status: 500 }
    );
  }
}

// Get a verification by ID
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }
    
    // Use raw query to get verification record
    const verifications = await prisma.$queryRaw<Verification[]>`
      SELECT * FROM verification WHERE id = ${id} LIMIT 1
    `;
    
    const verification = verifications[0];
    
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
} 