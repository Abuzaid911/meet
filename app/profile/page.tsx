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
import { Loader2 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
  username: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }
      
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
    if (!profile?.username) {
      addToast('Username is required', 'error')
      return
    }
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: profile.name, 
          bio: profile.bio,
          username: profile.username.toLowerCase().trim()
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfile(data)
      setIsEditing(false)
      addToast('Profile updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to update profile:', error)
      addToast(error instanceof Error ? error.message : 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center p-6">
        <p className="text-lg text-muted-foreground">Please sign in to view your profile</p>
        <Button asChild className="mt-4">
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
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
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    value={profile?.name || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev!, name: e.target.value }))}
                    placeholder="Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev!, username: e.target.value }))}
                    placeholder="Username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    placeholder="Email"
                    type="email"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                  <Textarea
                    id="bio"
                    value={profile?.bio || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev!, bio: e.target.value }))}
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="space-x-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-semibold">{profile?.name}</h3>
                <p className="text-muted-foreground">@{profile?.username}</p>
                <p className="text-muted-foreground">{profile?.email}</p>
                <p className="mt-2">{profile?.bio || 'No bio yet'}</p>
                <Button onClick={() => setIsEditing(true)} className="mt-2">
                  Edit Profile
                </Button>
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