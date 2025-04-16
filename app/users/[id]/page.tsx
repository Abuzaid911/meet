"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/app/components/ui/use-toast'
import { Button } from '@/app/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/card'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Badge } from '@/app/components/ui/badge'
import {
  CalendarIcon,
  Clock,
  MapPin,
  Loader2,
  ArrowLeft,
  UserPlus,
  UserCheck,
  Users,
  Calendar,
  AlertTriangle,
  Share2,
  Mail
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  image?: string
}

interface UserProfile {
  id: string
  name: string | null
  username: string
  image: string | null
  bio: string | null
  events: Event[]
  friendStatus: 'none' | 'pending' | 'friends'
  friendsCount: number
  eventsCount: number
  joinedAt?: string
  createdAt?: string
}

// Error display component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="container max-w-4xl mx-auto px-4 py-10 pt-20">
    <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
      <ArrowLeft className="h-5 w-5 mr-2" /> Back
    </Button>
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <CardTitle className="text-xl mb-2">An Error Occurred</CardTitle>
        <CardDescription className="mb-6">{error}</CardDescription>
        {onRetry && (
          <Button onClick={onRetry}>Retry</Button>
        )}
      </CardContent>
    </Card>
  </div>
);

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [isInviting, setIsInviting] = useState(false)
  const { addToast } = useToast()

  // Handle null params
  if (!params) {
    // Handle the case where params are null - e.g., show an error or loading state
    // You might want to return an error component or redirect
    // For now, we'll let the useEffect handle the missing ID
    console.error("User page params are null.");
    // Potentially redirect or return an error message component here
  }

  const id = params?.id as string; // Use optional chaining and type assertion

  // Define fetchProfile outside useEffect, wrapped in useCallback
  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    if (!id) {
      setError("User ID is missing or invalid.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error('User not found.')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      const errorMessage = error instanceof Error ? error.message : "Could not load user.";
      setError(errorMessage);
      addToast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [id, addToast]); // Add dependencies for useCallback

  const isCurrentUser = session?.user?.id === profile?.id

  // useEffect for initial profile fetch
  useEffect(() => {
    fetchProfile(); // Call the function here
  }, [fetchProfile]); // Depend on fetchProfile

  // Fetch current user's events for inviting
  useEffect(() => {
    if (session?.user?.id && !isCurrentUser) {
      const fetchMyEvents = async () => {
        try {
          const response = await fetch('/api/events/my-events')
          if (response.ok) {
            const data = await response.json()
            setMyEvents(data.events || [])
          }
        } catch (error) {
          console.error('Error fetching my events:', error)
        }
      }
      fetchMyEvents()
    }
  }, [session?.user?.id, isCurrentUser])

  const handleSendFriendRequest = async () => {
    if (!profile) return
    setIsSendingRequest(true)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      })
      if (!res.ok) throw new Error('Request failed')
      
      setProfile(prev => prev ? { ...prev, friendStatus: 'pending' } : null)
      
      addToast({ 
        title: 'Success', 
        description: 'Friend request sent successfully', 
        variant: 'default' 
      })
    } catch (error) {
      console.error('Error sending friend request:', error)
      addToast({ title: 'Error', description: 'Could not send request', variant: 'destructive' })
    } finally {
      setIsSendingRequest(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!profile) return
    setIsProcessingAction(true)
    try {
      const res = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: profile.id }),
      })
      if (!res.ok) throw new Error('Failed to remove friend')
      
      setProfile(prev => prev ? { ...prev, friendStatus: 'none' } : null)
      
      addToast({ 
        title: 'Success', 
        description: 'Friend removed successfully', 
        variant: 'default' 
      })
    } catch (error) {
      console.error('Error removing friend:', error)
      addToast({ title: 'Error', description: 'Could not remove friend', variant: 'destructive' })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.name || profile?.username}'s Profile`,
        url: window.location.href,
      })
      .catch(error => {
        console.error('Error sharing profile:', error)
        addToast({ 
          title: 'Error', 
          description: 'Could not share profile', 
          variant: 'destructive' 
        })
      })
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          addToast({ 
            title: 'Success', 
            description: 'Profile link copied to clipboard', 
            variant: 'default' 
          })
        })
        .catch(error => {
          console.error('Error copying to clipboard:', error)
          addToast({ 
            title: 'Error', 
            description: 'Could not copy profile link', 
            variant: 'destructive' 
          })
        })
    }
  }

  const handleSendInvite = async () => {
    if (!selectedEventId || !profile) return

    setIsInviting(true)
    try {
      const response = await fetch('/api/events/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: selectedEventId,
          userId: profile.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invitation')
      }

      addToast({
        title: 'Success',
        description: `Invitation sent to ${profile.name || profile.username}`,
        variant: 'default'
      })
      setShowInviteDialog(false)
    } catch (error) {
      console.error('Error sending invite:', error)
      addToast({
        title: 'Error',
        description: 'Could not send invitation',
        variant: 'destructive'
      })
    } finally {
      setIsInviting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 pt-20">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchProfile} />;
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-10 pt-20">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>
        
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
            <CardTitle className="text-xl mb-2">User Not Found</CardTitle>
            <CardDescription className="mb-6">
              The profile you&apos;re looking for doesn&apos;t exist or may have been removed.
            </CardDescription>
            <Button onClick={() => router.push("/")}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFriendActionButton = () => {
    if (isCurrentUser) return null;
    
    switch (profile.friendStatus) {
      case 'none':
        return (
          <Button
            onClick={handleSendFriendRequest}
            disabled={isSendingRequest}
            variant="default"
            className="rounded-full"
          >
            {isSendingRequest ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Add Friend
          </Button>
        );
      case 'pending':
        return (
          <Button variant="outline" disabled className="rounded-full">
            <Clock className="h-4 w-4 mr-2" />
            Request Sent
          </Button>
        );
      case 'friends':
        return (
          <Button 
            variant="secondary" 
            className="rounded-full"
            onClick={handleRemoveFriend}
            disabled={isProcessingAction}
          >
            {isProcessingAction ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Friends
          </Button>
        );
      default:
        return null;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Unknown date";
    try {
      return format(parseISO(date), "MMMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Get the creation date from either joinedAt or createdAt
  const getCreationDate = () => {
    const dateString = profile?.createdAt || profile?.joinedAt;
    return formatDate(dateString);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container max-w-4xl mx-auto px-4 py-8 pt-20"
    >
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-muted/80">
        <ArrowLeft className="h-5 w-5 mr-2" /> Back
      </Button>

      {/* Profile Card */}
      <Card className="mb-8 overflow-hidden border-muted bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-28 w-28 border-4 border-background">
              <AvatarImage src={profile.image || undefined} alt={profile.name || 'User'} />
              <AvatarFallback className="text-2xl">
                {profile.name?.[0] || profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {profile.name}
                    {isCurrentUser && (
                      <Badge variant="outline" className="ml-2 font-normal">
                        You
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    @{profile.username}
                  </CardDescription>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {renderFriendActionButton()}
                  
                  {!isCurrentUser && (
                    <Button 
                      variant="outline" 
                      className="rounded-full"
                      onClick={() => setShowInviteDialog(true)}
                      disabled={profile.friendStatus !== 'friends'}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full" 
                    title="Share profile"
                    onClick={handleShareProfile}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {profile.bio}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm mt-1">
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>{profile.friendsCount} {profile.friendsCount === 1 ? "Friend" : "Friends"}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span>{profile.eventsCount} {profile.eventsCount === 1 ? "Event" : "Events"}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  <span>Created at {getCreationDate()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="events" className="w-full">
          <CardContent className="pb-0 pt-2">
            <TabsList className="w-full justify-start border-b pb-px mb-4 bg-transparent">
              <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                Events
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                Friends
              </TabsTrigger>
            </TabsList>
          </CardContent>
          
          <TabsContent value="events" className="mt-0">
            <CardContent className="pt-2">
              <h3 className="text-lg font-semibold mb-3">
                Recent Events {profile.events.length > 0 && `(${profile.events.length})`}
              </h3>
              
              {profile.events.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.events.map(event => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="h-32 bg-muted relative">
                        {event.image ? (
                          <img 
                            src={event.image} 
                            alt={event.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Calendar className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold truncate">{event.name}</h4>
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center">
                            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-2" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="py-2 px-4 border-t flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/events/${event.id}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No events to display</p>
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="friends" className="mt-0">
            <CardContent className="pt-2">
              <h3 className="text-lg font-semibold mb-3">
                Friends {profile.friendsCount > 0 && `(${profile.friendsCount})`}
              </h3>
              
              {profile.friendsCount > 0 ? (
                <div>
                  {/* Friend list would be loaded here */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>Friend list loading...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No friends to display</p>
                  {!isCurrentUser && profile.friendStatus === 'none' && (
                    <Button 
                      variant="link" 
                      onClick={handleSendFriendRequest}
                      disabled={isSendingRequest}
                      className="mt-2"
                    >
                      Send a friend request
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Invite to Event Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite to Event</DialogTitle>
            <DialogDescription>
              Select an event to invite {profile?.name || profile?.username} to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {myEvents.length > 0 ? (
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {myEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-center text-muted-foreground">
                You don&apos;t have any events to invite to.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowInviteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvite} 
              disabled={!selectedEventId || isInviting || myEvents.length === 0}
            >
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
