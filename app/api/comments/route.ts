import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { eventId },
      include: { user: true },
    })
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text, eventId } = await request.json()
    const comment = await prisma.comment.create({
      data: { text, userId: session.user.id, eventId },
    })
    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Error creating comment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }
    const deleted = await prisma.comment.delete({ where: { id } })
    return NextResponse.json(deleted)
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, text } = await request.json()
    if (!id || !text) {
      return NextResponse.json({ error: 'Comment ID and text are required' }, { status: 400 })
    }
    const updated = await prisma.comment.update({ where: { id }, data: { text } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Error updating comment' }, { status: 500 })
  }
}

