import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000).toString()
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        username: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in GET /api/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { name, bio, username } = await request.json()

    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } })
      if (existingUser && existingUser.email !== session.user.email) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: { 
        name, 
        bio, 
        username: username || undefined,  // Only update if provided
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        username: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error in PUT /api/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json()

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const username = generateUsername(name)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    })

    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Error in POST /api/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

