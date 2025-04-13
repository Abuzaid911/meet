"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// Assuming components are in ../../components relative to this file
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { EventAttendees } from "../../components/event-attendees";
import { AddAttendeeModal } from "../../components/add-attendee-modal";
import { EditEventModal } from "../../components/edit-event-modal";
import { EventAttendance } from "../../components/enhanced-event-attendance";
import { ShareEventButton } from "../../components/share-event-button";
import { AddToCalendarButton } from "../../components/add-to-calendar-button";
import { Separator } from "../../components/ui/separator";
import { EventPhotoGallery } from "../../components/event-photos";

import {
  Loader2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Info,
  Camera // Icon for Photos tab
} from "lucide-react";
import { format, isPast, isToday, addMinutes, parseISO, isValid } from "date-fns"; // Added isValid
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces (assuming these remain the same) ---
interface Attendee { id: string; rsvp: string; user: { id: string; name: string | null; username?: string; image: string | null; }; }
interface Host { id: string; name: string | null; username?: string; image: string | null; }
interface Event {
  id: string;
  name: string;
  date: string; // ISO string format expected (e.g., "2025-12-31T00:00:00.000Z")
  time: string; // HH:mm format expected (e.g., "14:30")
  location: string;
  lat?: number | null; // Optional coordinates
  lng?: number | null; // Optional coordinates
  description: string | null; // Allow null
  duration: number; // Duration in minutes
  hostId: string;
  host: Host;
  attendees: Attendee[];
  // Optional header customization fields
  headerType?: "color" | "image";
  headerColor?: string; // e.g., "#ff0000" or "teal-500" (if mapping Tailwind colors)
  headerImageUrl?: string;
}

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 1 }, // Keep container visible
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// --- Skeleton Components ---
const EventPageSkeleton = () => (
  <div className="min-h-screen flex flex-col animate-pulse">
     {/* Header Area Skeleton */}
     <div className="relative w-full h-[50vh] min-h-[400px] bg-gray-200 dark:bg-gray-700">
        {/* Back button placeholder */}
        <div className="container mx-auto px-4 pt-20 pb-3 z-10 absolute top-0 left-0 right-0">
            <Skeleton className="h-9 w-24" />
        </div>
        {/* Overlaid Content Skeleton */}
        <div className="relative container mx-auto px-4 pt-14 pb-20 h-full flex flex-col">
            <div className="mt-auto space-y-4">
                {/* Badge & Share Button Skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                {/* Title Skeleton */}
                <Skeleton className="h-9 w-3/4 md:h-12 md:w-1/2" />
                {/* Host Skeleton */}
                <div className="flex items-center">
                    <Skeleton className="h-6 w-6 rounded-full mr-2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                {/* Key Details Overlay Skeleton */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 px-5 backdrop-blur-sm bg-black/10 dark:bg-black/30 rounded-lg max-w-2xl">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-start">
                            <Skeleton className="h-5 w-5 mr-3 rounded-md flex-shrink-0 mt-0.5" />
                            <div>
                                <Skeleton className="h-3 w-16 mb-1.5" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
         {/* Curved bottom placeholder */}
         <div className="absolute bottom-0 left-0 right-0 h-12 bg-background" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }}></div>
     </div>

     {/* Main Content Area Skeleton */}
     <div className="container mx-auto px-4 py-6 flex-grow bg-background">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-2 space-y-6">
                {/* Tabs Skeleton */}
                <div>
                    <Skeleton className="h-10 w-1/2 rounded-md mb-4" />
                    <Card>
                        <CardHeader> <Skeleton className="h-6 w-32"/> </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Right Sidebar Skeleton */}
            <div className="space-y-6 lg:sticky lg:top-24">
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32"/></CardHeader>
                    <CardContent className="p-6">
                        <Skeleton className="h-8 w-full mb-4" />
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32"/></CardHeader>
                    <CardContent className="p-6">
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
     </div>
  </div>
);


// --- Main Component ---
export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState("about"); // Default to 'about'
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  // --- Data Fetching ---
  const fetchEvent = useCallback(async () => {
    // Only set error null, don't reset loading on manual refetch
    setFetchError(null);
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Event not found.");
        throw new Error("Failed to fetch event details.");
      }
      const data = await response.json();
      if (!Array.isArray(data.attendees)) data.attendees = [];
      setEvent(data);
    } catch (error: unknown) {
      console.error("Error fetching event:", error);
      const message = error instanceof Error ? error.message : "Could not load event.";
      setFetchError(message);
      if (message !== "Event not found.") {
          addToast({ title: "Error", description: message, variant: "destructive" });
      }
    } finally {
      // Only set loading false on initial load triggered by useEffect
      // Manual refetches won't set isLoading back to false here
    }
  }, [id, addToast]); // Dependencies needed for useCallback

  useEffect(() => {
    if (id) {
      setIsLoading(true); // Set loading true only when ID changes or on initial mount
      fetchEvent().finally(() => {
          // Ensure loading is set to false after the initial fetch completes
          setIsLoading(false);
      });
    } else {
      setIsLoading(false);
      setFetchError("Event ID is missing.");
    }
  }, [id, fetchEvent]); // Rerun when id changes, fetchEvent is stable due to useCallback

  // --- Event Handlers ---
   const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete event");
      addToast({ title: "Success", description: "Event deleted successfully", variant: "success" });
      router.push("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
      addToast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };
  // Use fetchEvent directly for updates
  const handleAttendeeUpdate = () => fetchEvent();
  const handleEventUpdated = () => { setShowEditEventModal(false); fetchEvent(); };

  // --- Derived State ---
  const isHost = session?.user?.id === event?.hostId;

  // Use temporary variables for safe date parsing
  let eventDate: Date | null = null;
  let eventStartDateTime: Date | null = null;
  let eventEndTime: Date | null = null;
  let isPastEvent = false;
  let isActiveEvent = false;

  if (event?.date) {
      try {
          const parsedDate = parseISO(event.date);
          if (isValid(parsedDate)) { // Check if date is valid
              eventDate = parsedDate;
              if(event.time) {
                  const dateTimeString = `${event.date.substring(0, 10)}T${event.time}`;
                  const parsedStartDateTime = new Date(dateTimeString); // Use native Date constructor
                   if (isValid(parsedStartDateTime)) {
                       eventStartDateTime = parsedStartDateTime;
                       eventEndTime = addMinutes(eventStartDateTime, event.duration);
                       isPastEvent = isPast(eventEndTime);
                       isActiveEvent = isToday(eventDate) && !isPast(eventEndTime) && isPast(eventStartDateTime);
                   }
              }
          }
      } catch (e) {
          console.error("Error parsing event date/time:", e);
          // Keep dates as null if parsing fails
      }
  }

  const confirmedAttendees = event?.attendees?.filter(a => a.rsvp === "YES") ?? [];
  const maybeAttendees = event?.attendees?.filter(a => a.rsvp === "MAYBE") ?? [];

  // --- Render Logic ---

  if (isLoading) return <EventPageSkeleton />;

  if (fetchError) {
    // Error State Card
    return (
       <div className="container mx-auto px-4 py-10 pt-24 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
         <Card className="w-full max-w-md p-6 text-center">
           <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
           <h2 className="text-xl font-semibold mb-2 text-destructive">{fetchError === 'Event not found.' ? 'Event Not Found' : 'Error Loading Event'}</h2>
           <p className="text-muted-foreground mb-6">{fetchError === 'Event not found.' ? "The event you're looking for doesn't exist or may have been removed." : "There was a problem loading the event data. Please try again later."}</p>
           <Button onClick={() => router.back()} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
         </Card>
       </div>
     );
  }

  if (!event || !eventDate || !eventStartDateTime) {
    // Fallback if data is invalid after loading without error
     return ( <div className="flex flex-col justify-center items-center h-screen text-muted-foreground"><h2 className="text-2xl font-semibold">Event data unavailable or invalid</h2><Button onClick={() => router.push("/events")} className="mt-4">Back to Events</Button></div>);
  }

  // Generate Google Maps URL - Corrected
   const mapQuery = event.lat && event.lng
    ? `${event.lat},${event.lng}`
    : encodeURIComponent(event.location);
   // Use standard search query for text, or direct coordinates link
   const mapUrl = event.lat && event.lng
    ? `https://www.google.com/maps?q=$${mapQuery}` // Link for coordinates
    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`; // Link for search term

  return (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="min-h-screen flex flex-col bg-background" // Ensure background covers page
    >
      {/* Back Button - Positioned above header */}
      <div className="container mx-auto px-4 pt-20 pb-3 z-20 relative"> {/* Increased z-index */}
         {/* Apply text color based on header type for better contrast */}
        <Button
            variant="ghost"
            onClick={() => router.back()}
            className={`flex items-center pl-0 hover:bg-transparent ${event.headerType === 'image' ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Custom Header - Either Image or Color */}
      <div className="relative w-full h-[50vh] min-h-[400px]"> {/* Ensure header has height */}
        {/* Header Background */}
        <div className="absolute inset-0">
            {event.headerType === "image" && event.headerImageUrl ? (
              <>
                <img
                  src={event.headerImageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide img on error */ }}
                />
                 {/* Fallback color div in case image fails or is missing */}
                 <div
                    className="absolute inset-0 -z-10"
                    style={{ backgroundColor: event.headerColor || "#14b8a6" /* Default Teal */ }}
                 ></div>
                {/* Gradient overlay for image */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70"></div>
              </>
            ) : (
              // Solid color background with subtle gradient
              <div
                className="h-full w-full"
                style={{ backgroundColor: event.headerColor || "#14b8a6" /* Default Teal */ }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60"></div>
              </div>
            )}
        </div>


        {/* Content overlaid on header */}
        <div className="relative container mx-auto px-4 pt-10 pb-16 md:pb-20 h-full flex flex-col text-white z-10"> {/* Adjusted padding */}
          <div className="mt-auto space-y-3"> {/* Use space-y for consistent spacing */}
            {/* Status Badge & Share Button */}
            <div className="flex items-center justify-between">
              <div>
                {isPastEvent ? ( <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">Past Event</Badge> )
                : isActiveEvent ? ( <Badge className="bg-green-500 border-green-600 text-white shadow-sm animate-pulse backdrop-blur-sm">Happening Now</Badge> )
                : ( <Badge className="bg-blue-500 border-blue-600 text-white shadow-sm backdrop-blur-sm">Upcoming</Badge> )}
              </div>
              <ShareEventButton eventId={event.id.toString()} eventName={event.name} size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10 backdrop-blur-sm" />
            </div>

            {/* Event Name */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight drop-shadow-md">{event.name}</h1>

            {/* Host Info */}
            <div className="flex items-center text-white/90">
              <span className="mr-2">Hosted by</span>
              <Link href={`/users/${event.host.id}`} className="flex items-center group">
                <Avatar className="h-6 w-6 mr-1.5 border border-white/30 group-hover:border-white transition-colors">
                  <AvatarImage src={event.host?.image || undefined} alt={event.host?.name ?? "Host"}/>
                  <AvatarFallback className="text-xs bg-white/10">{event.host?.name?.[0]?.toUpperCase() || "H"}</AvatarFallback>
                </Avatar>
                <span className="font-medium group-hover:text-white transition-colors">{event.host?.name || "Unknown"}</span>
              </Link>
            </div>

            {/* Key Details Overlay Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4 px-5 backdrop-blur-md bg-black/40 dark:bg-black/50 rounded-lg max-w-2xl shadow-lg">
              {/* Date */}
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-teal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/70">Date</p>
                  <p className="font-medium">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p> {/* Ensure year is included */}
                </div>
              </div>
              {/* Time & Duration */}
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 text-teal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/70">Time & Duration</p>
                  <p className="font-medium">{event.time} ({event.duration} minutes)</p>
                </div>
              </div>
              {/* Location */}
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-teal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/70">Location</p>
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-teal-300 flex items-center group">
                    {event.location}
                    <ExternalLink className="h-4 w-4 ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
              {/* Attendees Summary */}
              <div className="flex items-start">
                <Users className="h-5 w-5 mr-3 text-teal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/70">Attendees</p>
                  <div className="font-medium flex items-center">
                    <span className="mr-2">{confirmedAttendees.length} going</span>
                    {maybeAttendees.length > 0 && (
                      <span className="text-xs text-white/60">(+{maybeAttendees.length} maybe)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Bottom Edge - Ensure background matches main content area */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-background z-10" style={{
          clipPath: 'ellipse(70% 100% at 50% 100%)'
        }}></div>
      </div>

      {/* Main Content Below Header */}
      <div className="container mx-auto px-4 py-6 flex-grow relative z-0"> {/* Ensure content is above background but below header curve */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- Main Content Area --- */}
          <motion.div className="lg:col-span-2 space-y-6" variants={staggerContainer}>
            {/* Tabs for Description and Attendees */}
            <motion.div variants={fadeIn}>
              <Tabs defaultValue="about" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="bg-muted/60 dark:bg-muted/30 p-1 mb-6 rounded-lg">
                  <TabsTrigger 
                    value="about" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                  >
                    <Info className="mr-1.5 h-4 w-4"/> About
                  </TabsTrigger>
                  <TabsTrigger 
                    value="attendees" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                  >
                    <Users className="mr-1.5 h-4 w-4"/> Attendees ({confirmedAttendees.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="photos" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
                  >
                    <Camera className="mr-1.5 h-4 w-4"/> Photos
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} // Faster fade
                  >
                    {/* About Tab */}
                    {selectedTab === "about" && (
                      <TabsContent value="about" forceMount className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-6 space-y-6">
                            {/* Description */}
                            {event.description ? (
                              <div>
                                <h2 className="text-lg font-semibold mb-2">About this event</h2>
                                <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{event.description}</p>
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-center py-4">No description provided.</p>
                            )}

                            <Separator />

                            {/* Action Buttons */}
                            <div>
                              <h3 className="text-md font-semibold mb-3">Actions</h3>
                              <div className="flex flex-wrap gap-3">
                                {event && <AddToCalendarButton
                                  event={{
                                    name: event.name,
                                    description: event.description || '', // Provide fallback
                                    date: event.date,
                                    time: event.time,
                                    duration: event.duration,
                                    location: event.location
                                  }}
                                />}
                                {/* Share button moved to header */}
                                {isHost && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => setShowEditEventModal(true)}>
                                      <Edit className="mr-1.5 h-4 w-4" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setShowAddAttendeeModal(true)}>
                                      <Users className="mr-1.5 h-4 w-4" /> Invite
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                                      {isDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Attendees Tab */}
                    {selectedTab === "attendees" && (
                      <TabsContent value="attendees" forceMount className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-6">
                            <EventAttendees eventId={event.id} isHost={isHost} />
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Photos Tab */}
                    {selectedTab === "photos" && (
                      <TabsContent value="photos" forceMount className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-6">
                            <EventPhotoGallery 
                              eventId={event.id} 
                              isHost={isHost} 
                              isPastEvent={isPastEvent} 
                              isAttending={event.attendees.some(a => a.user.id === session?.user?.id && a.rsvp === "YES")}
                            />
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </motion.div>

          {/* --- Right Sidebar (Sticky) --- */}
          <motion.div
            variants={fadeIn}
            transition={{ delay: 0.2 }} // Slight delay for sidebar entrance
            className="space-y-6 lg:sticky lg:top-24" // Adjust top offset if needed
          >
            {/* RSVP Widget */}
            <EventAttendance eventId={event.id} />

            {/* Similar Events Placeholder */}
            {!isPastEvent && (
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Similar Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-8">
                    <p>Feature coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* --- Modals & Dialogs --- */}
      {showAddAttendeeModal && (
        <AddAttendeeModal
          isOpen={showAddAttendeeModal}
          onClose={() => setShowAddAttendeeModal(false)}
          eventId={event.id}
          onAttendeeAdded={handleAttendeeUpdate}
        />
      )}

      {showEditEventModal && event && (
        <EditEventModal
          eventId={event.id}
          onClose={() => setShowEditEventModal(false)}
          onEventUpdated={handleEventUpdated}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event &quot;{event.name}&quot; and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
