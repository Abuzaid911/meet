// app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET: Fetch user notifications
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch notifications for the current user
    const notifications = await prisma.notification.findMany({
      where: {
        targetUserId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        // Include friend request details if it's a friend request notification
        friendRequest: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        // Include event details if it's an event-related notification
        attendee: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: 20, // Limit to the 20 most recent notifications
    })

    return NextResponse.json({
      notifications,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

/**
 * DELETE: Delete a notification
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await request.json()
    
    // Verify that the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { targetUserId: true }
    })
    
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }
    
    if (notification.targetUserId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Delete the notification
    await prisma.notification.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}