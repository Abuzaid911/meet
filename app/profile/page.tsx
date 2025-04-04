"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../components/ui/use-toast"
import { FriendList } from "./friend-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { ProfileMobileNavigation } from "./profile-mobile-navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { 
  Calendar, 
  Mail, 
  User, 
  Edit2, 
  Save, 
  X, 
  Loader2, 
  Camera, 
  Upload, 
  UserPlus,
  CalendarRange,
  Settings,
  Clock,
  Users,
  MapPin,
  ChevronRight
} from "lucide-react"
import { motion } from "framer-motion"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import Link from "next/link"
import { format } from "date-fns"

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  bio: string | null
}

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description?: string
  duration: number
  hostId: string
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
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

  const fetchEvents = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoadingEvents(true)
      const response = await fetch(`/api/events?userId=${session.user.id}`)
      if (!response.ok) throw new Error('Failed to fetch events')

      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      addToast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingEvents(false)
    }
  }, [session?.user?.id, addToast])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfile()
      fetchEvents()
    }
  }, [status, session, fetchProfile, fetchEvents])

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

      // Update session to reflect name changes
      if (updateSession && profile?.name !== session?.user?.name) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: profile?.name || session?.user?.name
          }
        })
      }

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
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gradient-to-r from-teal-400 to-blue-500 p-3">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-semibold">Loading Profile</h2>
          <p className="text-gray-500 text-center max-w-sm">
            We&apos;re getting your profile information ready. This will just take a moment.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-6">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Please sign in to view and manage your profile.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth/signin'} 
                className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Sign In Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 space-y-6 max-w-7xl pb-20"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Profile Header */}
      <div className="w-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md">
        {/* Background Cover with gradient */}
        <div className="h-48 bg-gradient-to-r from-teal-400 to-blue-500 relative">
          {/* Profile Actions */}
          <div className="absolute top-4 right-4 flex space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={cancelEditing} 
                  disabled={isSaving}
                  className="flex items-center bg-white/20 hover:bg-white/30 text-white border-white/20"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex items-center bg-white hover:bg-gray-100 text-teal-600"
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
                className="flex items-center bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        
        {/* Profile Info Section */}
        <div className="px-6 sm:px-10 pb-8 -mt-20 relative">
          {/* Profile Image */}
          <div className="relative inline-block">
            {/* Hidden file input for image upload */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            
            <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-gray-800 shadow-lg">
              <AvatarImage src={profile?.image || undefined} alt={profile?.name || 'User'} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-teal-400 to-blue-500 text-white">
                {profile?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload overlay button or loading indicator */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md"
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImageClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload Picture</span>
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

          {isEditing ? (
            <div className="mt-6 max-w-2xl">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                      @
                    </span>
                    <Input
                      value={profile?.username || ''}
                      onChange={(e) => setProfile((prev) => prev ? { ...prev, username: e.target.value } : prev)}
                      placeholder="username"
                      className="rounded-l-none w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <Input
                    value={profile?.email || ''}
                    disabled
                    className="w-full bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <Textarea
                    value={profile?.bio || ''}
                    onChange={(e) => setProfile((prev) => prev ? { ...prev, bio: e.target.value } : prev)}
                    placeholder="Tell us about yourself"
                    className="w-full min-h-[120px]"
                  />
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6">
              <h1 className="text-3xl font-bold flex items-center">
                {profile?.name || 'User'}
                <Badge className="ml-3 bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100 font-normal">
                  @{profile?.username}
                </Badge>
              </h1>
              
              <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                <span>{profile?.email}</span>
              </div>
              
              <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-2xl">
                {profile?.bio || 'No bio provided. Click Edit Profile to add some information about yourself.'}
              </p>
            </div>
          )}

          {/* Profile Navigation */}
          <div className="mt-10 border-b border-gray-200 dark:border-gray-700">
            <Tabs 
              defaultValue="overview" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="flex bg-transparent gap-2 w-full justify-start">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 px-4 py-2"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 px-4 py-2"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger 
                  value="friends" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 px-4 py-2"
                >
                  Friends
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 px-4 py-2"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <Card className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Events Created</p>
                    <h3 className="text-3xl font-bold mt-1">{events.filter(e => e.hostId === profile?.id).length}</h3>
                  </div>
                  <div className="bg-teal-100 dark:bg-teal-800/40 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Events</p>
                    <h3 className="text-3xl font-bold mt-1">{events.length}</h3>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-800/40 p-3 rounded-full">
                    <CalendarRange className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</p>
                    <h3 className="text-xl font-semibold mt-1">April 2025</h3>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-800/40 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <h2 className="text-xl font-semibold">Recent Events</h2>
              <div className="space-y-4">
                {isLoadingEvents ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : events.length > 0 ? (
                  events.slice(0, 3).map((event) => (
                    <Link href={`/events/${event.id}`} key={event.id}>
                      <Card className="overflow-hidden hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-24 bg-gradient-to-r from-teal-400 to-blue-500 text-white flex flex-row md:flex-col items-center justify-center p-4">
                              <div className="text-2xl font-bold mr-2 md:mr-0">
                                {new Date(event.date).getDate()}
                              </div>
                              <div className="text-sm font-medium">
                                {format(new Date(event.date), 'MMM')}
                              </div>
                            </div>
                            <div className="p-5 flex-1">
                              <h3 className="font-semibold text-lg mb-1">{event.name}</h3>
                              <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center p-4">
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2">
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                      <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">You don&apos;t have any upcoming events.</p>
                      <Button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600">
                        <Link href="/events/new">Create an Event</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {events.length > 0 && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => setActiveTab("events")}>
                      View All Events
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-5">Friends</h2>
              <Card className="h-full">
                <CardContent className="p-4 h-full">
                  <Button 
                    variant="outline" 
                    className="w-full mb-4" 
                    onClick={() => setActiveTab("friends")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Friend List
                  </Button>
                  
                  {/* This will be a preview of the friend list */}
                  <div className="max-h-96 overflow-hidden">
                    <FriendList previewMode={true} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Events Tab Content */}
        <TabsContent value="events" className="mt-0">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Events</h2>
              <Button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600">
                <Link href="/events/new">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </div>

            {isLoadingEvents ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id}>
<Card className="overflow-hidden hover:shadow-md transition-shadow hover:border-teal-200 dark:hover:border-teal-800 h-full">
                      <div className="h-40 bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{event.name}</h3>
                        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <CalendarRange className="h-4 w-4 mr-2" />
                            <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{event.time} ({event.duration} min)</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                        {event.hostId === profile?.id && (
                          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100">
                            You&apos;re hosting
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                  <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">You don&apos;t have any upcoming events.</p>
                  <Button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600">
                    <Link href="/events/new">Create an Event</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Friends Tab Content */}
        <TabsContent value="friends" className="mt-0">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <FriendList />
          </div>
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-teal-500" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Information</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Update your profile information including your name, username, and bio.
                </p>
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <h3 className="text-lg font-medium">Profile Picture</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Update your profile picture. We recommend using a square image at least 400x400 pixels.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleImageClick}
                    className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Picture
                  </Button>
                  {profile?.image && (
                    <Button 
                      variant="outline"
                      onClick={handleRemoveProfilePicture}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove Picture
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <h3 className="text-lg font-medium">Email Address</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your current email address is <strong>{profile?.email}</strong>
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Your email address is managed by your authentication provider and cannot be changed here.
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <h3 className="text-lg font-medium">Account Security</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage your account security settings and preferences.
                </p>
                <Button variant="outline">
                  Change Password
                </Button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage your notification preferences.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email notifications about your events</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive push notifications about your events</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600">
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Mobile Navigation */}
      <ProfileMobileNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </motion.div>
  )
}