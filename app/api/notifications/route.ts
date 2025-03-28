// app/api/notifications/route.ts
import { NextResponse } from "next/server"
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
        createdAt: "desc",
      },
      include: {
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
      take: 20,
    });

    if (!notifications) {
      throw new Error("Failed to fetch notifications from database");
    }

    return NextResponse.json({ notifications, success: true });
  } catch (error) {
    console.error("Error fetching notifications:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * PATCH: Mark notifications as read
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 })
    }

    // Update notifications read status
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        targetUserId: session.user.id, // Ensure user owns these notifications
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ message: "Notifications marked as read" })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Verify that the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    if (notification.targetUserId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    })

    return NextResponse.json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}