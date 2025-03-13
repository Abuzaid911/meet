"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../components/ui/use-toast"
import { FriendList } from "./friend-list"
import { EventList } from "../components/event-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Calendar, Mail, User, Edit2, Save, X, Loader2, Camera, Upload } from "lucide-react"
import { motion } from "framer-motion"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  bio: string | null
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
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
  }, [addToast])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfile()
    }
  }, [status, session, fetchProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile?.name,
          username: profile?.username,
          bio: profile?.bio
        }),
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
      setIsSaving(false)
    }
  }

  const cancelEditing = () => {
    // Reset to original profile data
    fetchProfile().then(() => setIsEditing(false))
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: "Invalid file",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploadingImage(true)
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append('image', file)

      // Send the image to the server
      const response = await fetch('/api/user/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Update the profile state with the new image
      setProfile(prev => prev ? { ...prev, image: data.image } : prev)
      
      // Update the session to reflect the new image
      if (updateSession) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            image: data.image
          }
        })
      }

      addToast({
        title: "Success",
        description: "Profile picture updated successfully!",
        variant: "success"
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      })
    } finally {
      setIsUploadingImage(false)
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return
    }

    setIsUploadingImage(true)
    
    try {
      const response = await fetch('/api/user/image', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove profile picture')
      }

      // Update the profile state with the default image
      setProfile(prev => prev ? { ...prev, image: null } : prev)
      
      // Update the session to reflect the removal of the image
      if (updateSession) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            image: null
          }
        })
      }

      addToast({
        title: "Success",
        description: "Profile picture removed successfully!",
        variant: "success"
      })
    } catch (error) {
      console.error('Error removing profile picture:', error)
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove profile picture",
        variant: "destructive"
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pt-20">
        <Loader2 className="w-12 h-12 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-500 text-lg">Loading your profile...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen pt-20">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md text-center">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view and manage your profile.</p>
          <Button onClick={() => window.location.href = '/auth/signin'} className="bg-gradient-to-r from-teal-400 to-blue-500 text-white">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-10 space-y-8 pt-24"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flex flex-col md:flex-row items-start justify-between mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={cancelEditing} 
                disabled={isSaving}
                className="flex items-center"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center bg-gradient-to-r from-teal-400 to-blue-500 text-white"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Profile
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="flex items-center bg-gradient-to-r from-teal-400 to-blue-500 text-white"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-400 to-blue-500 p-8 flex flex-col items-center">
              {/* Hidden file input for image upload */}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              
              {/* Profile picture with upload overlay */}
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-white shadow-md">
                  <AvatarImage src={profile?.image || undefined} alt={profile?.name || 'User'} />
                  <AvatarFallback className="text-2xl bg-gray-200 text-teal-600">
                    {profile?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload overlay button or loading indicator */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleImageClick}>
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Upload New Picture</span>
                    </DropdownMenuItem>
                    {profile?.image && (
                      <DropdownMenuItem onClick={handleRemoveProfilePicture}>
                        <X className="mr-2 h-4 w-4" />
                        <span>Remove Picture</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {!isEditing && (
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
                  <Badge variant="outline" className="mt-2 bg-white/20 text-white border-none">
                    @{profile?.username}
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-6">
              {isEditing ? (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      value={profile?.name || ''}
                      onChange={(e) => setProfile((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                      placeholder="Enter your full name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <Input
                      value={profile?.username || ''}
                      onChange={(e) => setProfile((prev) => prev ? { ...prev, username: e.target.value } : prev)}
                      placeholder="Choose a username"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      value={profile?.email || ''}
                      disabled
                      className="w-full bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <Textarea
                      value={profile?.bio || ''}
                      onChange={(e) => setProfile((prev) => prev ? { ...prev, bio: e.target.value } : prev)}
                      placeholder="Tell us about yourself"
                      className="w-full min-h-[100px]"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="text-gray-400 mr-2 h-5 w-5" />
                    <span className="text-gray-800">{profile?.email}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">About</h3>
                    <p className="text-gray-600">
                      {profile?.bio || 'No bio provided. Click Edit Profile to add some information about yourself.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Friends and Events */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="events" className="text-base">My Events</TabsTrigger>
              <TabsTrigger value="friends" className="text-base">Friends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-teal-500" />
                    Upcoming Events
                  </CardTitle>
                  <CardDescription>
                    Events you&apos;re hosting or attending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventList />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="friends" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-teal-500" />
                    Your Friends
                  </CardTitle>
                  <CardDescription>
                    Manage your connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FriendList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  )
}