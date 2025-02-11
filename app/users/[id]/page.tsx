'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { useToast } from '../../components/ui/use-toast'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react'

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
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  const fetchProfile = useCallback(async () => {
    console.log('Fetching profile for ID:', params.id) // Debug log

    if (!params.id) {
      console.log('No ID provided') // Debug log
      setIsLoading(false)
      addToast({
        title: 'Error',
        description: 'Invalid user ID',
        variant: 'destructive',
      })
      return
    }

    try {
      console.log('Making fetch request') // Debug log
      const response = await fetch(`/api/users/${params.id}`)
      console.log('Response received:', response.status) // Debug log

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      console.log('Data received:', data) // Debug log
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [params.id, addToast])

  useEffect(() => {
    if (params.id) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [params.id, fetchProfile])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold">User not found</h2>
        <Button asChild className="mt-4">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.image || undefined} alt={profile.name || 'User'} />
              <AvatarFallback>{profile.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && (
                <p className="text-muted-foreground mt-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.events.length === 0 ? (
            <p className="text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="space-y-4">
              {profile.events.map((event) => (
                <div key={event.id} className="flex items-start space-x-4">
                  <CalendarIcon className="w-5 h-5 mt-1 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                    <Link 
                      href={`/events/${event.id}`}
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}