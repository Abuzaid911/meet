"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createAuthClient } from "better-auth/react"

const {  useSession  } = createAuthClient()
import { Button } from "../components/ui/button"
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
  User,
  Loader2,
  UserPlus,
} from "lucide-react"
import { motion } from "framer-motion"
import { Skeleton } from "../components/ui/skeleton"
import { Dialog } from "../components/ui/dialog"
import { EditProfileDialogContent, ProfileFormData } from "../components/edit-profile-dialog"
import { ProfileHeaderCard } from "../components/profile/profile-header-card"
import { OverviewStats } from "../components/profile/overview-stats"
import { EventListItem } from "../components/profile/event-list-item"

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
  // Add a hydration safety check
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const { data: session, isPending: status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const fetchProfile = useCallback(async () => {
    const maxRetries = 3;
    let retryCount = 0;

    const attemptFetch = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await fetch('/api/user', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying profile fetch (attempt ${retryCount})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptFetch();
        }

        addToast({
          title: "Network Error",
          description: "Failed to load profile. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    await attemptFetch();
  }, [addToast]);

  const fetchEvents = useCallback(async () => {
    if (!session?.user?.id) return;

    const maxRetries = 3;
    let retryCount = 0;

    const attemptFetch = async () => {
      try {
        setIsLoadingEvents(true);
        const response = await fetch(`/api/events?userId=${session.user.id}`, {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying events fetch (attempt ${retryCount})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptFetch();
        }

        addToast({
          title: "Network Error",
          description: "Failed to load events. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingEvents(false);
      }
    };

    await attemptFetch();
  }, [session?.user?.id, addToast]);

  const fetchFriendsAndRequests = useCallback(async () => {
    const maxRetries = 3;
    let retryCount = 0;

    const attemptFetch = async () => {
      try {
        setIsLoadingFriends(true);
        const response = await fetch('/api/friends/request', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);
      } catch (error) {
        console.error('Error fetching friends and requests:', error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying friends fetch (attempt ${retryCount})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptFetch();
        }

        addToast({
          title: "Network Error",
          description: "Failed to load friends. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingFriends(false);
      }
    };

    await attemptFetch();
  }, [addToast]);

  useEffect(() => {
    if (!status && session && session?.user) {
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchProfile(),
            fetchEvents(),
            fetchFriendsAndRequests()
          ]);
        } catch (error) {
          console.error('Error in initial data fetch:', error);
          addToast({
            title: "Connection Error",
            description: "There was a problem loading your data. Please refresh the page.",
            variant: "destructive"
          });
        }
      };

      fetchData();
    }
  }, [status, session, fetchProfile, fetchEvents, fetchFriendsAndRequests, addToast]);

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          bio: data.bio
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      
      // Update state safely with a function to avoid stale closures
      setProfile(prev => ({
        ...prev,
        ...updatedProfile
      }));
      
      setIsEditDialogOpen(false);
      
      addToast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "success"
      });

      // Force a re-fetch of profile data to ensure everything is in sync
      setTimeout(() => {
        fetchProfile();
      }, 300);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
      throw error;
    }
  }

  const handleImageClick = () => {
    if (!isClient) return; // Skip if not hydrated
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isClient) return; // Skip if not hydrated
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: "Invalid file",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', file);

      // Send the image to the server
      const response = await fetch('/api/user/image', {
        method: 'POST',
        body: formData,
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      // Update the profile state with the new image
      setProfile(prev => prev ? { ...prev, image: data.image } : prev);
      
      addToast({
        title: "Success",
        description: "Profile picture updated successfully!",
        variant: "success"
      });

      // Force a re-fetch of profile data to ensure everything is in sync
      setTimeout(() => {
        fetchProfile();
      }, 300);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!isClient) return; // Skip if not hydrated
    
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setIsUploadingImage(true);

    try {
      const response = await fetch('/api/user/image', {
        method: 'DELETE',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove profile picture');
      }

      // Update the profile state with the default image
      setProfile(prev => prev ? { ...prev, image: null } : prev);
      
      addToast({
        title: "Success",
        description: "Profile picture removed successfully!",
        variant: "success"
      });

      // Force a re-fetch of profile data to ensure everything is in sync
      setTimeout(() => {
        fetchProfile();
      }, 300);
      
    } catch (error) {
      console.error('Error removing profile picture:', error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isClient) {
    // Return a minimal loading state during hydration
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gradient-to-r from-teal-400 to-blue-500 p-3">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-semibold">Loading Profile</h2>
        </div>
      </div>
    )
  }

  if (status === true || isLoadingProfile) {
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

  if (!status && !session) {
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
            <>
              {/* Hidden file input element for image upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              
              {/* Use the new ProfileHeaderCard component */}
              <ProfileHeaderCard 
                profile={profile}
                isUploadingImage={isUploadingImage}
                onEditClick={() => setIsEditDialogOpen(true)}
                onImageUploadClick={handleImageClick}
                onImageRemoveClick={handleRemoveProfilePicture}
                isClient={isClient}
              />
            </>
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
                      {/* Use the new OverviewStats component */}
                      <OverviewStats
                        eventsCount={events.length}
                        friendsCount={friends.length}
                        isLoadingEvents={isLoadingEvents}
                        isLoadingFriends={isLoadingFriends}
                        joinedDate={profile.createdAt}
                      />
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
                    // Use the new EventListItem component
                    <div className="space-y-3">
                      {events.map((event) => (
                        <EventListItem
                          key={event.id}
                          id={event.id}
                          name={event.name}
                          date={event.date}
                          time={event.time}
                          location={event.location}
                          description={event.description}
                        />
                      ))}
                    </div>
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

      {/* Dialog component with improved focus management */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          // If the dialog is closing, ensure we reset focus properly
          if (!open) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
              // Find the dropdown trigger button by accessing the DOM
              const settingsButton = document.querySelector('.settings-dropdown-trigger') as HTMLButtonElement;
              if (settingsButton) {
                settingsButton.focus();
              }
            }, 50);
          }
        }}
      >
        <EditProfileDialogContent
          profile={profile}
          onSaveChanges={handleSubmit}
        />
      </Dialog>
    </div>
  )
} 