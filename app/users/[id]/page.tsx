"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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

  useEffect(() => {
    if (params.id) {
      fetchProfile()
    }
  }, [params.id]) // ✅ Fixed dependencies

  const fetchProfile = async () => {
    try {
      setIsLoading(true) // ✅ Show loading state while fetching
      const response = await fetch(`/api/users/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      addToast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false) // ✅ Hide loading state
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-10 space-y-12 pt-24">
      {/* ✅ Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </Button>

      {/* ✅ Profile Card */}
      <Card className="bg-white shadow-lg rounded-lg p-6">
        <CardHeader>
          <div className="flex items-center space-x-6">
            {/* ✅ Avatar */}
            <Avatar className="w-24 h-24 border-2 border-gray-300">
              <AvatarImage src={profile.image || undefined} alt={profile.name || 'User'} />
              <AvatarFallback>{profile.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>

            {/* ✅ Profile Info */}
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-800">{profile.name}</CardTitle>
              <p className="text-gray-600">@{profile.username}</p>
              {profile.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ✅ Upcoming Events */}
      <Card className="bg-white shadow-lg rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.events.length === 0 ? (
            <p className="text-gray-600">No upcoming events</p>
          ) : (
            <div className="space-y-4">
              {profile.events.map((event) => (
                <div key={event.id} className="flex items-start space-x-4 border-b pb-4">
                  <CalendarIcon className="w-6 h-6 text-gray-500" />
                  <div>
                    <h4 className="font-semibold text-gray-800">{event.name}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                    <Link 
                      href={`/events/${event.id}`}
                      className="text-sm text-teal-600 hover:underline mt-1 inline-block"
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