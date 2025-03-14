"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/app/components/ui/use-toast'
import { Button } from '@/app/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs'
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  Loader2, 
  ArrowLeft, 
  UserPlus, 
  Check, 
  Users,
  Calendar 
} from 'lucide-react'
import { format } from 'date-fns'

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
}

interface UserProfile {
  id: string
  name: string | null
  username: string
  image: string | null
  bio: string | null
  events: Event[]
  friendStatus: 'none' | 'pending' | 'friends'
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  const { addToast } = useToast()

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch profile')
        const data = await response.json()
        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        addToast({
          title: 'Error',
          description: 'Failed to fetch profile.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchProfile()
    }
  }, [params.id, addToast])

  // Handle sending friend request
  const handleSendFriendRequest = async () => {
    if (!profile) return;

    setIsSendingRequest(true);
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }

      // Update local state to show pending
      setProfile(prev => prev ? { ...prev, friendStatus: 'pending' } : null);
      
      addToast({
        title: 'Friend request sent',
        description: `A friend request has been sent to ${profile.name || profile.username}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <h2 className="text-2xl font-semibold">User not found</h2>
        <Button onClick={() => router.push('/')} className="mt-4">Return Home</Button>
      </div>
    )
  }

  const isCurrentUser = session?.user?.id === profile.id;

  return (
    <div className="container mx-auto px-4 py-10 space-y-8 pt-24">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="flex items-center space-x-2 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.image || undefined} alt={profile.name || profile.username} />
                <AvatarFallback className="text-2xl">
                  {profile.name?.[0] || profile.username[0]}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{profile.name || profile.username}</CardTitle>
              <CardDescription className="text-base">@{profile.username}</CardDescription>
            </div>
            
            {!isCurrentUser && (
              <div className="mt-2">
                {profile.friendStatus === 'none' && (
                  <Button 
                    onClick={handleSendFriendRequest} 
                    disabled={isSendingRequest}
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                  >
                    {isSendingRequest ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Add Friend
                  </Button>
                )}
                
                {profile.friendStatus === 'pending' && (
                  <Button 
                    variant="outline" 
                    disabled
                    className="w-full bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Friend Request Sent
                  </Button>
                )}
                
                {profile.friendStatus === 'friends' && (
                  <Button 
                    variant="outline" 
                    disabled
                    className="w-full bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Friends
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {profile.bio ? (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
              </div>
            ) : (
              <div className="mt-4 text-center text-gray-500 py-8">
                <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No bio provided</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Events */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="events">
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="events" className="text-base">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <CalendarIcon className="mr-2 h-5 w-5 text-teal-500" />
                    Upcoming Events
                  </CardTitle>
                  <CardDescription>
                    Events {profile.name || profile.username} is hosting or attending
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {profile.events.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.events.map((event) => (
                        <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{event.name}</h3>
                            
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{event.time}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button asChild className="mt-3 md:mt-0 md:ml-4" variant="outline" size="sm">
                            <Link href={`/events/${event.id}`}>View Event</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}