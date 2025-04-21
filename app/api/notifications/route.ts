// app/api/notifications/route.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma, NotificationSourceType } from "@prisma/client"

const getNotificationsSchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  read: z.string().optional(),
});

type NotificationWhereClause = {
  targetUserId: string;
  sourceType?: { in: NotificationSourceType[] } | NotificationSourceType;
  isRead?: boolean;
}

/**
 * GET: Fetch user notifications with filtering options
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Handle multiple values for the same parameter (like type=X&type=Y)
    const queryParams: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      if (queryParams[key]) {
        if (Array.isArray(queryParams[key])) {
          (queryParams[key] as string[]).push(value);
        } else {
          queryParams[key] = [queryParams[key] as string, value];
        }
      } else {
        queryParams[key] = value;
      }
    });
    
    const parsed = getNotificationsSchema.safeParse(queryParams);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid query parameters", 
        details: parsed.error.format() 
      }, { status: 400 });
    }
    
    const { limit = "20", offset = "0", type, read } = parsed.data;
    
    // Build the query
    const where: NotificationWhereClause = {
      targetUserId: session.user.id,
    };
    
    // Add optional filters
    if (type) {
      // Handle both string and array of strings
      if (Array.isArray(type)) {
        // Convert string types to enum values
        const enumTypes = type.map(t => t.toUpperCase() as NotificationSourceType);
        // Filter out any invalid types
        const validTypes = enumTypes.filter(t => 
          Object.values(NotificationSourceType).includes(t as NotificationSourceType)
        ) as NotificationSourceType[];
        
        where.sourceType = { in: validTypes };
      } else {
        const upperType = type.toUpperCase() as NotificationSourceType;
        // Check if it's a valid enum value
        if (Object.values(NotificationSourceType).includes(upperType as NotificationSourceType)) {
          where.sourceType = upperType;
        }
      }
    }
    
    if (read === "true") {
      where.isRead = true;
    } else if (read === "false") {
      where.isRead = false;
    }

    // Count total notifications (for pagination)
    const totalCount = await prisma.notification.count({
      where: where as Prisma.NotificationWhereInput,
    });

    // Fetch notifications with filters
    const notifications = await prisma.notification.findMany({
      where: where as Prisma.NotificationWhereInput,
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
                username: true,
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
                image: true,
                date: true,
                time: true,
                location: true,
                host: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
        },
      },
      take: parseInt(limit.toString()),
      skip: parseInt(offset.toString()),
    });

    if (!notifications) {
      throw new Error("Failed to fetch notifications from database");
    }

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        targetUserId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ 
      notifications, 
      unreadCount,
      totalCount,
      success: true 
    });
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
    const session = await auth.api.getSession(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAll = false, markAllAsRead = true } = body

    if (markAll) {
      // Mark all notifications as read or unread
      await prisma.notification.updateMany({
        where: {
          targetUserId: session.user.id,
        },
        data: {
          isRead: markAllAsRead,
          readAt: markAllAsRead ? new Date() : null,
        },
      });
      
      const action = markAllAsRead ? "read" : "unread";
      return NextResponse.json({ message: `All notifications marked as ${action}` });
    }
    
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "No notification IDs provided" }, { status: 400 })
    }

    // Update notifications read status
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        targetUserId: session.user.id, // Ensure user owns these notifications
      },
      data: {
        isRead: markAllAsRead,
        readAt: markAllAsRead ? new Date() : null,
      },
    });

    const action = markAllAsRead ? "read" : "unread";
    return NextResponse.json({ message: `Notifications marked as ${action}` });
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

/**
 * DELETE: Delete notifications (single or bulk)
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")
    const deleteAll = searchParams.get("all") === "true"
    const deleteRead = searchParams.get("read") === "true"

    // Delete all notifications (with optional filtering)
    if (deleteAll) {
      const where: NotificationWhereClause = {
        targetUserId: session.user.id,
      };
      
      // Only delete read notifications if specified
      if (deleteRead) {
        where.isRead = true;
      }
      
      const { count } = await prisma.notification.deleteMany({
        where: where as Prisma.NotificationWhereInput,
      });
      
      return NextResponse.json({ 
        message: `${count} notifications deleted successfully`,
        count 
      });
    }
    
    // Delete specific notification by ID
    if (notificationId) {
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
      });

      return NextResponse.json({ message: "Notification deleted successfully" });
    }
    
    // Delete notifications in bulk
    const body = await request.json().catch(() => null);
    if (body && Array.isArray(body.notificationIds) && body.notificationIds.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: body.notificationIds },
          targetUserId: session.user.id, // Ensure user owns these notifications
        },
      });
      
      return NextResponse.json({ 
        message: `${result.count} notifications deleted successfully`,
        count: result.count
      });
    }

    return NextResponse.json({ error: "Missing notification ID or bulk delete parameters" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting notification(s):", error)
    return NextResponse.json({ error: "Failed to delete notification(s)" }, { status: 500 })
  }
}