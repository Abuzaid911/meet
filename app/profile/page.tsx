'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { FriendList } from '../components/friend-list'
import { EventList } from '../components/event-list'
import { useToast } from '../components/ui/use-toast'

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
  }, [status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      addToast('Failed to load profile', 'error')
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
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditing(false)
      addToast('Profile updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to update profile:', error)
      addToast('Failed to update profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="text-center">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return <div className="text-center">Please sign in to view your profile</div>
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">My Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.image || undefined} alt={profile?.name || 'User'} />
              <AvatarFallback>{profile?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
                <Input
                  value={profile?.name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev!, name: e.target.value }))}
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
                  onChange={(e) => setProfile(prev => ({ ...prev!, bio: e.target.value }))}
                  placeholder="Bio"
                />
                <div className="space-x-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-semibold">{profile?.name}</h3>
                <p className="text-muted-foreground">{profile?.email}</p>
                <p className="mt-2">{profile?.bio}</p>
                <Button onClick={() => setIsEditing(true)} className="mt-2">Edit Profile</Button>
              </div>
            )}
          </div>
          <FriendList />
        </div>
        <div className="space-y-4">
          <EventList />
        </div>
      </div>
    </div>
  )
}

