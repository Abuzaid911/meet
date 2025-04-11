"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../components/ui/use-toast"
import { FriendList, Friend, FriendRequest } from "./friend-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "../components/ui/card"

import { 
  Calendar, 
  Mail, 
  User, 
  Edit2, 
  Save, 
  X, 
  Loader2, 
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
import { format, parseISO } from "date-fns"
import { Skeleton } from "../components/ui/skeleton"
import { Label } from "../components/ui/label"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "../components/ui/dialog"

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  bio: string | null
  createdAt: string
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editBio, setEditBio] = useState("")
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
      setIsLoadingProfile(true)
      const response = await fetch('/api/user')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      addToast({ title: "Error", description: "Failed to load profile.", variant: "destructive" })
    } finally {
      setIsLoadingProfile(false)
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
      addToast({ title: "Error", description: "Failed to load events.", variant: "destructive" })
    } finally {
      setIsLoadingEvents(false)
    }
  }, [session?.user?.id, addToast])

  const fetchFriendsAndRequests = useCallback(async () => {
    try {
      setIsLoadingFriends(true)
      const response = await fetch('/api/friends/request')
      if (!response.ok) {
        throw new Error('Failed to fetch friends and requests')
      }
      const data = await response.json()
      setFriends(data.friends || [])
      setPendingRequests(data.pendingRequests || [])
    } catch (error) {
      console.error('Error fetching friends and requests:', error)
      addToast({
        title: "Error",
        description: "Failed to load friends and requests",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFriends(false)
    }
  }, [addToast])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfile()
      fetchEvents()
      fetchFriendsAndRequests()
    }
  }, [status, session, fetchProfile, fetchEvents, fetchFriendsAndRequests])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          bio: editBio
        }),
      })

      if (!response.ok) throw new Error('Failed to update profile')
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditDialogOpen(false)

      // Update session to reflect name changes
      if (updateSession && editName !== session?.user?.name) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: editName || session?.user?.name
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

  if (status === 'loading' || isLoadingProfile) {
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
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Profile Info */}
        <motion.div
          className="md:col-span-1 space-y-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {isLoadingProfile ? (
            // --- Profile Info Skeleton ---
            <Card>
              <CardHeader className="items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-40 mt-4" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="text-center">
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </CardContent>
              <CardFooter className="flex justify-center">
                 <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ) : profile ? (
            // --- Actual Profile Info ---
            <Card className="relative overflow-hidden">
              <CardHeader className="items-center text-center pt-8 pb-4 bg-gradient-to-b from-muted/50 to-background">
                  <Avatar
                      className="w-24 h-24 border-4 border-background shadow-md relative group"
                  >
                      <AvatarImage src={profile.image ?? undefined} alt={profile.name ?? profile.username ?? 'User'} />
                      <AvatarFallback className="text-3xl">
                          {profile.name ? profile.name.charAt(0).toUpperCase() : profile.username ? profile.username.charAt(0).toUpperCase() : <User />}
                      </AvatarFallback>
                      {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                              <Loader2 className="text-white h-8 w-8 animate-spin" />
                          </div>
                      )}
                  </Avatar>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                  />
                  <div className="flex items-center justify-center gap-2 mt-4">
                        <CardTitle className="text-2xl font-semibold">{profile.name || "Unnamed User"}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem 
                               onSelect={(event) => { 
                                 event.preventDefault(); 
                                 setIsEditDialogOpen(true);
                               }} 
                             >
                                <Edit2 className="mr-2 h-4 w-4" /> 
                                <span>Edit Profile</span> 
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={handleImageClick}> <Upload className="mr-2 h-4 w-4" /> <span>Upload Picture</span> </DropdownMenuItem>
                             {profile.image && (<DropdownMenuItem onClick={handleRemoveProfilePicture} className="text-red-600 focus:text-red-600 focus:bg-red-50"> <X className="mr-2 h-4 w-4" /> <span>Remove Picture</span> </DropdownMenuItem>)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                   </div>
                  <CardDescription>@{profile.username || "username_missing"}</CardDescription>
              </CardHeader>

              <CardContent className="px-6 py-4 text-sm text-muted-foreground">
                   {/* Always display static info now */}
                  <p className="text-center mb-4 text-foreground italic">{profile.bio || "No bio yet."}</p>
                  <div className="space-y-2">
                      <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          <span>{profile.email || "No email provided"}</span>
                      </div>
                      <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Joined {format(parseISO(profile.createdAt), 'PPP')}</span>
                      </div>
                  </div>
              </CardContent>
            </Card>
          ) : (
            // --- Error/Not Found State ---
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Could not load profile information.
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Right Column: Tabs */}
        <motion.div
          className="md:col-span-2"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          style={{ transitionDelay: '0.1s' }} // Stagger animation
        >
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center md:justify-start mb-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="events">Events ({isLoadingEvents ? '...' : events.length})</TabsTrigger>
                <TabsTrigger value="friends">Friends ({isLoadingFriends ? '...' : friends.length})</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab Content */}
            <TabsContent value="overview">
              <Card>
                 <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>Profile summary and key information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   {isLoadingProfile ? (
                      <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-4 w-1/2" />
                      </div>
                  ) : profile ? (
                     <div className="space-y-4">
                          {/* Profile Summary Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Card className="bg-secondary/50">
                                 <CardContent className="p-4 flex items-center space-x-3">
                                      <div className="p-2 bg-primary/10 rounded-lg">
                                           <CalendarRange className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                         <p className="text-xs text-muted-foreground">Events Hosted/Attending</p>
                                         <p className="font-semibold text-lg">{isLoadingEvents ? '...' : events.length}</p>
                                     </div>
                                 </CardContent>
                              </Card>
                              <Card className="bg-secondary/50">
                                  <CardContent className="p-4 flex items-center space-x-3">
                                      <div className="p-2 bg-primary/10 rounded-lg">
                                           <Users className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                         <p className="text-xs text-muted-foreground">Friends</p>
                                         <p className="font-semibold text-lg">{isLoadingFriends ? '...' : friends.length}</p>
                                     </div>
                                 </CardContent>
                              </Card>
                              <Card className="bg-secondary/50">
                                  <CardContent className="p-4 flex items-center space-x-3">
                                      <div className="p-2 bg-primary/10 rounded-lg">
                                           <Clock className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                         <p className="text-xs text-muted-foreground">Member Since</p>
                                         <p className="font-semibold text-lg">{format(parseISO(profile.createdAt), 'MMM yyyy')}</p>
                                     </div>
                                 </CardContent>
                              </Card>
                          </div>
                          {/* Bio and Email */}
                      </div>
                  ) : (
                      <p className="text-muted-foreground">Could not load overview.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab Content */}
            <TabsContent value="events">
              <Card>
                 <CardHeader>
                    <CardTitle>My Events</CardTitle>
                    <CardDescription>Events you are hosting or attending.</CardDescription>
                 </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingEvents ? (
                     // --- Events Skeleton ---
                    <>
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="flex items-center space-x-4 p-4">
                           <Skeleton className="h-10 w-10 rounded-md" />
                           <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-3 w-1/4" />
                           </div>
                           <Skeleton className="h-6 w-6 rounded-full" />
                        </Card>
                      ))}
                    </>
                  ) : events.length > 0 ? (
                     // --- Actual Event List ---
                    events.map((event) => (
                       <Link href={`/events/${event.id}`} key={event.id} className="block hover:bg-muted/50 transition-colors rounded-lg">
                          <Card className="flex items-start space-x-4 p-4 border shadow-sm hover:shadow-md">
                             {/* Event Icon or Image Placeholder */}
                             <div className="p-2 bg-primary/10 rounded-lg mt-1">
                                <CalendarRange className="h-6 w-6 text-primary" />
                             </div>

                             <div className="flex-1 space-y-1">
                                <p className="font-semibold text-base leading-tight">{event.name}</p>
                                <div className="text-xs text-muted-foreground flex items-center space-x-3 flex-wrap">
                                   <span className="flex items-center"><Calendar className="mr-1 h-3 w-3"/> {format(parseISO(event.date), 'PP')}</span>
                                   <span className="flex items-center"><Clock className="mr-1 h-3 w-3"/> {event.time}</span>
                                   <span className="flex items-center"><MapPin className="mr-1 h-3 w-3"/> {event.location}</span>
                                   {/* Add duration if needed */}
                                </div>
                                 {/* Optional: Show short description */}
                                 {/* <p className="text-sm text-muted-foreground truncate">{event.description}</p> */}
                             </div>
                             <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                          </Card>
                       </Link>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-6">No events found.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Friends Tab Content */}
            <TabsContent value="friends">
               <FriendList 
                 friends={friends}
                 pendingRequests={pendingRequests}
                 isLoading={isLoadingFriends}
                 onAction={fetchFriendsAndRequests}
               />
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>

      {/* *** Place the Dialog component here, separate from the elements above *** */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (isOpen && profile) { 
            console.log("DEBUG: Setting edit state from profile:", profile);
            const newName = profile.name || "";
            const newUsername = profile.username || "";
            const newBio = profile.bio || "";
            setEditName(newName);
            setEditUsername(newUsername);
            setEditBio(newBio);
            console.log("DEBUG: Set edit states:", { newName, newUsername, newBio });
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>Edit Profile</DialogTitle>
               <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re done.
               </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               {(console.log("DEBUG: Rendering DialogContent with states:", { editName, editUsername, editBio }), null)}
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="dialog-name" className="text-right">Name</Label>
                 <Input
                   id="dialog-name"
                   value={editName}
                   onChange={(e) => {
                     console.log("DEBUG: Name onChange triggered. Value:", e.target.value);
                     setEditName(e.target.value);
                   }}
                   className="col-span-3"
                 />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="dialog-username" className="text-right">Username</Label>
                 <Input
                   id="dialog-username"
                   value={editUsername}
                   onChange={(e) => {
                     console.log("DEBUG: Username onChange triggered. Value:", e.target.value);
                     setEditUsername(e.target.value);
                   }}
                   className="col-span-3"
                 />
               </div>
               <div className="grid grid-cols-4 items-start gap-4">
                 <Label htmlFor="dialog-bio" className="text-right pt-2">Bio</Label>
                 <Textarea
                   id="dialog-bio"
                   value={editBio}
                   onChange={(e) => {
                     console.log("DEBUG: Bio onChange triggered. Value:", e.target.value);
                     setEditBio(e.target.value);
                   }}
                   rows={3}
                   placeholder="Tell us about yourself..."
                   className="col-span-3"
                 />
               </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={() => handleSubmit()} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save changes
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}