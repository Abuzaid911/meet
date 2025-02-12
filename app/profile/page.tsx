"use client"

import { useState, useEffect } from "react"
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../components/ui/use-toast"
import { FriendList } from './friend-list'
import { EventList } from '../components/event-list'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status]) // ✅ Fixed: Added dependencies

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfile();
    }
  }, [status, session]);  // ✅ Added session as a dependency

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user')
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
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile?.name, bio: profile?.bio }),
      })
      if (!response.ok) throw new Error('Failed to update profile')
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditing(false)
      addToast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "success"
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      addToast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return <div className="flex justify-center items-center h-screen text-gray-500">Please sign in to view your profile</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 pt-18">
      {/* ✅ Profile Header */}
      <h2 className="text-3xl font-bold text-gray-800 text-center md:text-left">.</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ✅ Left Section - Profile Info */}
        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-4">
            {/* ✅ Avatar */}
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.image || undefined} alt={profile?.name || 'User'} />
              <AvatarFallback>{profile?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>

            {/* ✅ Profile Details */}
            {isEditing ? (
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <Input
                  value={profile?.name || ''}
                  onChange={(e) => setProfile((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Name"
                />
                <Input
                  value={profile?.email || ''}
                  placeholder="Email"
                  type="email"
                  disabled
                />
                <Textarea
                  value={profile?.bio || ''}
                  onChange={(e) => setProfile((prev) => prev ? { ...prev, bio: e.target.value } : prev)}
                  placeholder="Bio"
                />
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{profile?.name}</h3>
                <p className="text-gray-600">{profile?.email}</p>
                <p className="mt-2 text-gray-700">{profile?.bio}</p>
                <Button onClick={() => setIsEditing(true)} className="mt-2">Edit Profile</Button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Right Section - Friends & Events */}
        <div className="space-y-6">
          {/* ✅ Friends Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Friends</h3>
            <FriendList />
          </div>

          {/* ✅ Events Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Events</h3>
            <EventList />
          </div>
        </div>
      </div>
    </div>
  )
}