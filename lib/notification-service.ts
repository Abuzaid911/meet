import { NotificationSourceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Creates a notification for the specified user
 */
export async function createNotification({
  message,
  link,
  sourceType,
  targetUserId,
  attendeeId,
  friendRequestId,
  priority = 1,
}: {
  message: string;
  link?: string;
  sourceType: NotificationSourceType;
  targetUserId: string;
  attendeeId?: string;
  friendRequestId?: string;
  priority?: 1 | 2 | 3; // 1: normal, 2: important, 3: urgent
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        message,
        link: link || null,
        sourceType,
        targetUserId,
        attendeeId,
        friendRequestId,
        priority,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Creates event notifications for multiple users
 */
export async function createEventNotifications({
  message,
  link,
  sourceType,
  targetUserIds,
  eventId,
  priority = 1,
}: {
  message: string;
  link?: string;
  sourceType: NotificationSourceType;
  targetUserIds: string[];
  eventId: string;
  priority?: 1 | 2 | 3;
}) {
  try {
    // Get all attendees for these users at this event
    const attendees = await prisma.attendee.findMany({
      where: {
        eventId,
        userId: { in: targetUserIds },
      },
    });

    // Create a map of userId -> attendeeId for quick lookup
    const attendeeMap = new Map(
      attendees.map((attendee) => [attendee.userId, attendee.id])
    );

    // Create notifications in bulk
    const notifications = await Promise.all(
      targetUserIds.map(async (userId) => {
        const attendeeId = attendeeMap.get(userId);
        
        if (!attendeeId) {
          console.warn(`No attendee record found for user ${userId} in event ${eventId}`);
        }
        
        return prisma.notification.create({
          data: {
            message,
            link: link || null,
            sourceType,
            targetUserId: userId,
            attendeeId,
            priority,
          },
        });
      })
    );

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating event notifications:', error);
    return { success: false, error };
  }
}

/**
 * Creates system notifications for all users or specific users
 */
export async function createSystemNotification({
  message,
  link,
  targetUserIds,
  priority = 1,
}: {
  message: string;
  link?: string;
  targetUserIds?: string[]; // If undefined, send to all users
  priority?: 1 | 2 | 3;
}) {
  try {
    let userIds = targetUserIds;
    
    // If no specific users are provided, get all active users
    if (!userIds || userIds.length === 0) {
      const users = await prisma.user.findMany({
        where: {
          // Optional: Add filters for active users
          // lastActive: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Active in last 30 days
        },
        select: { id: true },
      });
      userIds = users.map((user) => user.id);
    }
    
    // Create notifications in bulk
    const notificationData = userIds.map((userId) => ({
      message,
      link: link || null,
      sourceType: 'SYSTEM' as NotificationSourceType,
      targetUserId: userId,
      priority,
    }));
    
    const result = await prisma.notification.createMany({
      data: notificationData,
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error creating system notifications:', error);
    return { success: false, error };
  }
}

/**
 * Helper to create friend request notifications
 */
export async function createFriendRequestNotification({
  friendRequestId,
  targetUserId,
  senderName,
}: {
  friendRequestId: string;
  targetUserId: string;
  senderName: string;
}) {
  return createNotification({
    message: `${senderName} sent you a friend request`,
    link: '/profile', // Page where they can see friend requests
    sourceType: 'FRIEND_REQUEST',
    targetUserId,
    friendRequestId,
    priority: 2, // Friend requests are medium priority
  });
}

/**
 * Helper to create event invitation notifications
 */
export async function createEventInvitationNotification({
  eventId,
  eventName,
  attendeeId,
  targetUserId,
  hostName,
  privacyLevel = "PUBLIC",
}: {
  eventId: string;
  eventName: string;
  attendeeId: string;
  targetUserId: string;
  hostName: string;
  privacyLevel?: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
}) {
  // Set message based on privacy level
  let message = "";
  let priority: 1 | 2 | 3 = 1;
  let sourceType: NotificationSourceType = "ATTENDEE";

  switch (privacyLevel) {
    case "PRIVATE":
      message = `${hostName} invited you to their private event: ${eventName}`;
      priority = 2; // Higher priority for private invitations
      sourceType = "PRIVATE_INVITATION";
      break;
    case "FRIENDS_ONLY":
      message = `${hostName} invited you to a friends-only event: ${eventName}`;
      priority = 2; // Medium priority
      break;
    case "PUBLIC":
    default:
      message = `${hostName} invited you to an event: ${eventName}`;
      priority = 1; // Standard priority
  }

  return createNotification({
    message,
    link: `/events/${eventId}`,
    sourceType,
    targetUserId,
    attendeeId,
    priority,
  });
}

/**
 * Helper to create event update notifications
 */
export async function createEventUpdateNotification({
  eventId,
  eventName,
  targetUserIds,
  updateType,
}: {
  eventId: string;
  eventName: string;
  targetUserIds: string[];
  updateType: 'date' | 'time' | 'location' | 'details' | 'cancelled';
}) {
  const sourceType = updateType === 'cancelled' 
    ? 'EVENT_CANCELLED' as NotificationSourceType
    : 'EVENT_UPDATE' as NotificationSourceType;
    
  const priority = updateType === 'cancelled' ? 3 : 2;
  
  let message = '';
  switch (updateType) {
    case 'date':
      message = `The date for "${eventName}" has been updated`;
      break;
    case 'time':
      message = `The time for "${eventName}" has been updated`;
      break;
    case 'location':
      message = `The location for "${eventName}" has changed`;
      break;
    case 'details':
      message = `Event details for "${eventName}" have been updated`;
      break;
    case 'cancelled':
      message = `Event "${eventName}" has been cancelled`;
      break;
    default:
      message = `Event "${eventName}" has been updated`;
  }
  
  return createEventNotifications({
    message,
    link: `/events/${eventId}`,
    sourceType,
    targetUserIds,
    eventId,
    priority,
  });
}

/**
 * Helper to create event reminder notifications
 */
export async function createEventReminderNotifications({
  eventId,
  eventName,
  eventDate,
  eventTime,
  targetUserIds,
}: {
  eventId: string;
  eventName: string;
  eventDate: Date;
  eventTime: string;
  targetUserIds: string[];
}) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(eventDate);
  
  return createEventNotifications({
    message: `Reminder: "${eventName}" is happening ${formattedDate} at ${eventTime}`,
    link: `/events/${eventId}`,
    sourceType: 'EVENT_REMINDER',
    targetUserIds,
    eventId,
    priority: 2,
  });
} 