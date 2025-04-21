'use client';

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Bell, BellRing, Check, Calendar, UserPlus, RefreshCw, 
  Trash2, Filter, Clock, Info, AlertCircle, MailCheck, Settings
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { Button } from '@/app/components/ui/button'
import { createAuthClient } from "better-auth/react"

const {  useSession  } = createAuthClient()
import { useRouter } from 'next/navigation'
import { format, formatDistance } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { useToast } from './ui/use-toast'
import { Skeleton } from './ui/skeleton'

interface Notification {
  id: string
  message: string
  link: string | null
  sourceType: 'ATTENDEE' | 'FRIEND_REQUEST' | 'EVENT_UPDATE' | 'EVENT_CANCELLED' | 'EVENT_REMINDER' | 'COMMENT' | 'MENTION' | 'SYSTEM'
  isRead: boolean
  readAt: string | null
  createdAt: string
  targetUserId: string
  priority: number
  friendRequest?: {
    sender: {
      id: string
      name: string
      image: string | null
      username: string
    }
  }
  attendee?: {
    event: {
      id: string
      name: string
      image: string | null
      date: string
      time: string
      location: string
      host: {
        id: string
        name: string
        image: string | null
      }
    }
    user: {
      id: string
      name: string
      image: string | null
    }
  }
}

type NotificationFilter = 'all' | 'unread' | 'events' | 'friends' | 'system';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const notificationBellRef = useRef<HTMLButtonElement>(null);
  
  // Setup notification permission request for desktop notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // We'll request permission when user interacts with the bell
      const requestPermission = () => {
        Notification.requestPermission();
        bellRef?.removeEventListener('click', requestPermission);
      };
      
      const bellRef = notificationBellRef.current;
      bellRef?.addEventListener('click', requestPermission);
      
      return () => {
        bellRef?.removeEventListener('click', requestPermission);
      };
    }
  }, []);

  // Safe toast function to avoid issues
  const showToast = useCallback((props: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => {
    if (addToast) {
      addToast(props);
    } else {
      console.error('Toast functionality unavailable', props);
    }
  }, [addToast]);

  const fetchNotifications = useCallback(async (filterOrEvent?: NotificationFilter | React.MouseEvent) => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    
    try {
      // Determine the filter value
      const filter = typeof filterOrEvent === 'string' ? filterOrEvent : activeFilter;
      
      // Build query params based on filter
      const params = new URLSearchParams();
      
      if (filter === 'unread') {
        params.append('read', 'false');
      } else if (filter === 'events') {
        params.append('type', 'ATTENDEE');
        params.append('type', 'EVENT_UPDATE');
        params.append('type', 'EVENT_CANCELLED');
        params.append('type', 'EVENT_REMINDER');
      } else if (filter === 'friends') {
        params.append('type', 'FRIEND_REQUEST');
      } else if (filter === 'system') {
        params.append('type', 'SYSTEM');
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(typeof errorData === 'object' && errorData && 'error' in errorData ? errorData.error : 'Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      
      // Show desktop notification for new unread items if supported
      if (data.unreadCount > unreadCount && "Notification" in window && Notification.permission === "granted") {
        const newNotifications = data.notifications.filter((n: Notification) => !n.isRead);
        if (newNotifications.length > 0) {
          const latestNotification = newNotifications[0];
          new Notification("MeetOn Notification", {
            body: latestNotification.message,
            icon: "/favicon.ico"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, activeFilter, unreadCount, showToast]);

  // Apply a filter
  const handleFilterChange = (filter: NotificationFilter) => {
    setActiveFilter(filter);
    fetchNotifications(filter);
    setSelectedNotifications([]);
    setIsSelectionMode(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, [session?.user?.id, fetchNotifications]);

  // Open the notification popup
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && notifications.some(n => !n.isRead)) {
      markNotificationsAsRead();
    }
    
    if (!open) {
      // Reset selection when closing
      setSelectedNotifications([]);
      setIsSelectionMode(false);
    }
  };

  // Mark all visible notifications as read
  const markNotificationsAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      
      if (!response.ok) throw new Error('Failed to mark notifications as read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: true } : n)
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Mark all notifications as read (even those not in the current view)
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });
      
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      showToast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success"
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showToast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  };

  // Delete a single notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete notification');
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Update unread count if needed
      const deleted = notifications.find(n => n.id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  };

  // Delete all read notifications
  const deleteAllRead = async () => {
    try {
      const response = await fetch('/api/notifications?all=true&read=true', {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete read notifications');
      
      const result = await response.json();
      
      // Update local state
      setNotifications(prev => prev.filter(n => !n.isRead));
      
      showToast({
        title: "Success",
        description: `${result.count} notifications deleted`,
      });
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      showToast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive"
      });
    }
  };

  // Handle clicking on a notification
  const handleNotificationClick = (notification: Notification, event: React.MouseEvent) => {
    if (isSelectionMode) {
      event.preventDefault();
      event.stopPropagation();
      
      // Toggle selection
      setSelectedNotifications(prev => {
        if (prev.includes(notification.id)) {
          return prev.filter(id => id !== notification.id);
        } else {
          return [...prev, notification.id];
        }
      });
      return;
    }
    
    setIsOpen(false);
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedNotifications([]);
    }
  };

  // Delete selected notifications
  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: selectedNotifications }),
      });
      
      if (!response.ok) throw new Error('Failed to delete selected notifications');
      
      const result = await response.json();
      
      // Update local state
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      
      // Update unread count if needed
      const deletedUnread = notifications
        .filter(n => selectedNotifications.includes(n.id) && !n.isRead)
        .length;
        
      if (deletedUnread > 0) {
        setUnreadCount(prev => Math.max(0, prev - deletedUnread));
      }
      
      setSelectedNotifications([]);
      setIsSelectionMode(false);
      
      showToast({
        title: "Success",
        description: `${result.count} notifications deleted`,
      });
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
      showToast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive"
      });
    }
  };

  // Format notification timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistance(date, now, { addSuffix: true });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.sourceType) {
      case 'ATTENDEE':
        return <Calendar className="h-5 w-5 text-teal-500" />;
      case 'FRIEND_REQUEST':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'EVENT_UPDATE':
        return <Info className="h-5 w-5 text-amber-500" />;
      case 'EVENT_CANCELLED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'EVENT_REMINDER':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'COMMENT':
        return <MailCheck className="h-5 w-5 text-green-500" />;
      case 'MENTION':
        return <MailCheck className="h-5 w-5 text-indigo-500" />;
      case 'SYSTEM':
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <BellRing className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get sender info if available
  const getSender = (notification: Notification) => {
    if (notification.sourceType === 'FRIEND_REQUEST' && notification.friendRequest?.sender) {
      return notification.friendRequest.sender;
    } else if (notification.attendee?.user) {
      return notification.attendee.user;
    }
    return null;
  };

  // Filter notifications based on current filter
  const getFilteredNotifications = () => {
    // We're fetching filtered notifications directly from API, so this is a backup filter
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'events':
        return notifications.filter(n => ['ATTENDEE', 'EVENT_UPDATE', 'EVENT_CANCELLED', 'EVENT_REMINDER'].includes(n.sourceType));
      case 'friends':
        return notifications.filter(n => n.sourceType === 'FRIEND_REQUEST');
      case 'system':
        return notifications.filter(n => n.sourceType === 'SYSTEM');
      default:
        return notifications;
    }
  };

  // Get color class based on priority
  const getPriorityColorClass = (priority: number) => {
    switch (priority) {
      case 3:
        return 'border-l-4 border-red-500';
      case 2:
        return 'border-l-4 border-amber-500';
      default:
        return '';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          ref={notificationBellRef}
          variant="ghost" 
          size="icon" 
          className="relative"
        >
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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center">
              <h4 className="font-medium">Notifications</h4>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={fetchNotifications}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Refresh</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Filter</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className={activeFilter === 'all' ? 'bg-accent' : ''} 
                    onClick={() => handleFilterChange('all')}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={activeFilter === 'unread' ? 'bg-accent' : ''} 
                    onClick={() => handleFilterChange('unread')}
                  >
                    Unread
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={activeFilter === 'events' ? 'bg-accent' : ''} 
                    onClick={() => handleFilterChange('events')}
                  >
                    Events
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={activeFilter === 'friends' ? 'bg-accent' : ''} 
                    onClick={() => handleFilterChange('friends')}
                  >
                    Friends
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={activeFilter === 'system' ? 'bg-accent' : ''} 
                    onClick={() => handleFilterChange('system')}
                  >
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                        >
                          <MoreOptions className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>More options</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deleteAllRead}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete read notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleSelectionMode}>
                    {isSelectionMode ? 'Cancel selection' : 'Select notifications'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {isSelectionMode && selectedNotifications.length > 0 && (
            <div className="px-3 py-2 bg-muted border-b flex items-center justify-between">
              <span className="text-xs">
                {selectedNotifications.length} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm"
                className="h-7"
                onClick={deleteSelected}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
          
          {/* Tab filtering UI */}
          <Tabs defaultValue={activeFilter} value={activeFilter} onValueChange={(v) => handleFilterChange(v as NotificationFilter)}>
            <TabsList className="grid grid-cols-5 w-full h-9 px-1 border-b">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
              <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
            </TabsList>
            
            <div className="overflow-y-auto max-h-[60vh] bg-muted/5">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : getFilteredNotifications().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Bell className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-1">No notifications</p>
                  <p className="text-xs text-gray-400">
                    {activeFilter === 'all' 
                      ? "We'll notify you when something happens"
                      : `No ${activeFilter} notifications`}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {getFilteredNotifications().map((notification) => {
                    const sender = getSender(notification);
                    const isSelected = selectedNotifications.includes(notification.id);
                    
                    return (
                      <div 
                        key={notification.id}
                        className={`flex items-start gap-3 p-3 hover:bg-accent/10 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/80 dark:bg-blue-950/20' : ''} ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''} ${getPriorityColorClass(notification.priority)}`}
                        onClick={(e) => handleNotificationClick(notification, e)}
                      >
                        {isSelectionMode && (
                          <div className="mt-2">
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        )}
                        
                        {sender ? (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={sender.image || undefined} />
                            <AvatarFallback>
                              {sender.name ? sender.name[0] : '?'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            {getNotificationIcon(notification)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm break-words">{notification.message}</p>
                          
                          {notification.attendee?.event && (
                            <div className="mt-1 text-xs p-2 bg-muted/20 rounded">
                              <div className="font-medium">{notification.attendee.event.name}</div>
                              <div className="text-muted-foreground">
                                {format(new Date(notification.attendee.event.date), 'MMM d')} at {notification.attendee.event.time}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                            
                            {notification.isRead && notification.readAt && (
                              <span className="ml-3 text-xs text-gray-400 flex items-center">
                                <Check className="h-3 w-3 mr-1" />
                                Read
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!isSelectionMode && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MoreOptions(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}