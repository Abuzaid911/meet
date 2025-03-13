'use client';

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellRing, X, Check, Calendar, UserPlus } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { Button } from '@/app/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'

interface Notification {
  id: string
  message: string
  link: string | null
  sourceType: 'ATTENDEE' | 'FRIEND_REQUEST'
  createdAt: string
  targetUserId: string
  friendRequest?: {
    sender: {
      id: string
      name: string
      image: string | null
    }
  }
  attendee?: {
    event: {
      id: string
      name: string
    }
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      setNotifications(data.notifications || [])
      
      // Since there's no read field in your schema, we'll use the notification count as unread count
      // In a real implementation, you might want to add a separate table to track read status
      setUnreadCount(data.notifications.length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchNotifications()
    
    // Set up polling for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000)
    
    return () => clearInterval(intervalId)
  }, [session?.user?.id, fetchNotifications])

  // Open the notification popup
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    
    // When opening, we'll consider all notifications as viewed
    if (open && unreadCount > 0) {
      setUnreadCount(0)
    }
  }

  // Handle clicking on a notification
  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false)
    
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Format notification timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'h:mm a')
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  // Get icon based on notification type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.sourceType) {
      case 'ATTENDEE':
        return <Calendar className="h-5 w-5 text-teal-500" />
      case 'FRIEND_REQUEST':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      default:
        return <BellRing className="h-5 w-5 text-gray-500" />
    }
  }

  // Get sender info if available
  const getSender = (notification: Notification) => {
    if (notification.sourceType === 'FRIEND_REQUEST' && notification.friendRequest?.sender) {
      return notification.friendRequest.sender
    }
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[70vh] overflow-y-auto p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs"
            onClick={fetchNotifications}
          >
            <Check className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Bell className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 mb-1">No notifications</p>
            <p className="text-xs text-gray-400">
              We&apos;ll notify you when something happens
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const sender = getSender(notification);
              
              return (
                <div 
                  key={notification.id}
                  className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {sender ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={sender.image || undefined} />
                      <AvatarFallback>
                        {sender.name ? sender.name[0] : '?'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100">
                      {getNotificationIcon(notification)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{notification.message}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifications(prevNotifications => 
                        prevNotifications.filter(n => n.id !== notification.id)
                      );
                      if (unreadCount > 0) {
                        setUnreadCount(prev => prev - 1);
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}