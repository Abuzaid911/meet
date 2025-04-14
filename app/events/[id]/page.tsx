"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

// UI Components
import { Card } from "@/app/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useToast } from "@/app/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";

// App Components
import { AddAttendeeModal } from "@/app/components/add-attendee-modal";
import { EditEventModal } from "@/app/components/edit-event-modal";
import { EventPhotoGallery } from "@/app/components/event-photos";
import { EventHostActions } from "@/app/components/event-host-actions";

// Icons
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CalendarPlus,
  Share,
  UserPlus,
  Users,
  AlertTriangle,
  Loader2,
  Globe,
  Lock,
  UserCircle,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";

// Utilities
import { format } from "date-fns";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Interfaces
interface Attendee {
  id: string;
  rsvp: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username?: string;
    image: string | null;
  };
}

interface Host {
  id: string;
  name: string | null;
  username?: string;
  image: string | null;
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
  description: string | null;
  duration: number;
  hostId: string;
  host: Host;
  attendees: Attendee[];
  totalAttendees: number;
  headerType?: "color" | "image";
  headerColor?: string;
  headerImageUrl?: string;
  endDate: string;
  privacyLevel?: string; // "PUBLIC", "FRIENDS_ONLY", or "PRIVATE"
}

// Skeleton components
const EventPageSkeleton = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <div className="w-full max-w-3xl">
      <Skeleton className="h-64 w-full rounded-t-xl" />
      <Skeleton className="h-12 w-3/4 mt-6" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

// Error display component
const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Error</h2>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button onClick={() => window.history.back()} variant="default">
        Go Back
      </Button>
    </div>
  </div>
);

// Main Component
export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("details");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);

  // Fetch event data
  const fetchEvent = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/events/${id}`);

      if (!response.ok) {
        if (response.status === 404) throw new Error("Event not found");
        throw new Error("Failed to fetch event details");
      }

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error("Error fetching event:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Initial data load
  useEffect(() => {
    if (!id) {
      setError("Event ID is missing");
      setIsLoading(false);
      return;
    }

    fetchEvent();
  }, [id, fetchEvent]);

  // Event handlers
   const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete event");

      addToast({
        title: "Success",
        description: "Event deleted successfully",
      });
      router.push("/events");
    } catch (err) {
      console.error("Error deleting event:", err);
      addToast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRSVP = async (status: string) => {
    if (!event || !session?.user?.id) return;

    try {
      const response = await fetch(`/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp: status }),
      });

      if (!response.ok) throw new Error("Failed to update RSVP status");

      fetchEvent();
      addToast({
        title: "RSVP Updated",
        description: `You're now ${status.toLowerCase()} to this event`,
      });
    } catch (err) {
      console.error("Error updating RSVP:", err);
      addToast({
        title: "Error",
        description: "Failed to update your RSVP status",
        variant: "destructive",
      });
    }
  };

  // Format date helper
  const formatEventDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMMM d, yyyy");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  const formatEventTime = (timeStr: string): string => {
    try {
      return timeStr; // Already in HH:MM format
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeStr;
    }
  };

  // Computed properties
  const isHost = event?.hostId === session?.user?.id;
  const isPastEvent = event ? new Date(event.endDate) < new Date() : false;
  const isAttending = event?.attendees.some(a =>
    a.userId === session?.user?.id && a.rsvp === "YES"
  );

  // Get current user's RSVP status
  const getUserRsvp = (): 'YES' | 'MAYBE' | 'NO' | null => {
    if (!event || !session?.user?.id) return null;

    const userAttendance = event.attendees.find(a => a.userId === session.user.id);
    return userAttendance?.rsvp as 'YES' | 'MAYBE' | 'NO' | null;
  };

  // Get background style
  const getBackgroundStyle = () => {
    if (event?.headerImageUrl) {
      return {
        backgroundImage: `url(${event.headerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (event?.headerColor) {
      return {
        backgroundColor: event.headerColor,
      };
    }
    return {
      backgroundImage: 'linear-gradient(to right, #ff7e5f, #feb47b)',
    };
  };

  // Add function to create and download an ICS file
  const addToCalendar = () => {
    if (!event) return;

    try {
      // Create proper date objects with correct parsing
      const dateParts = event.date.split('-').map(part => parseInt(part, 10));
      const timeParts = event.time.split(':').map(part => parseInt(part, 10));

      // Create a valid date object (year, month (0-based), day, hours, minutes)
      const eventDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
      const endTime = new Date(eventDate.getTime() + event.duration * 60000);

      // Validate date objects
      if (isNaN(eventDate.getTime()) || isNaN(endTime.getTime())) {
        throw new Error("Invalid date or time format");
      }

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${event.id}@meet-app`,
        `SUMMARY:${event.name}`,
        `DTSTART:${formatICSDate(eventDate)}`,
        `DTEND:${formatICSDate(endTime)}`,
        `LOCATION:${event.location}`,
        event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
        `ORGANIZER;CN=${event.host.name || 'Event Host'}:MAILTO:noreply@example.com`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        `DTSTAMP:${formatICSDate(new Date())}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\r\n');

      // Create and trigger download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${event.name.replace(/\s+/g, '-')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        title: "Added to Calendar",
        description: "Calendar file downloaded successfully",
      });
    } catch (err) {
      console.error("Error creating calendar event:", err);
      addToast({
        title: "Error",
        description: "Failed to create calendar event",
        variant: "destructive",
      });
    }
  };

  // Helper to format date for ICS file
  const formatICSDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Format: YYYYMMDDTHHMMSSZ
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  // Get privacy display elements
  const getPrivacyDetails = (privacyLevel: string = "PUBLIC") => {
    switch (privacyLevel) {
      case "PRIVATE":
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Private Event",
          description: "Only invited guests can view and attend",
          color: "text-red-500",
          bgColor: "bg-red-100"
        };
      case "FRIENDS_ONLY":
        return {
          icon: <UserCircle className="h-4 w-4" />,
          label: "Friends Only",
          description: "Visible to your friends network",
          color: "text-blue-500",
          bgColor: "bg-blue-100"
        };
      case "PUBLIC":
      default:
        return {
          icon: <Globe className="h-4 w-4" />,
          label: "Public Event",
          description: "Visible to everyone on the platform",
          color: "text-green-500",
          bgColor: "bg-green-100"
        };
    }
  };

  // Loading state
  if (isLoading) return <EventPageSkeleton />;

  // Error state
  if (error) return <ErrorDisplay error={error} />;

  // Missing data state
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-6">The event you are looking for does not exist or may have been removed.</p>
          <Button onClick={() => router.push("/events")} variant="default">
            Go Back to Events
          </Button>
        </div>
       </div>
     );
  }

  // Render the event page
  return (
    <>
      {/* Full-page background with blur effect */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center"
        style={getBackgroundStyle()}
      >
        <div className="absolute inset-0 backdrop-blur-none bg-black/40" />
      </div>

      {/* Back button */}
      <div className="fixed top-2 sm:top-4 left-2 sm:left-4 z-10">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="bg-black/30 hover:bg-black/40 text-white h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center px-2 sm:px-4 py-10 sm:py-16 relative z-10">
        <Card className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-black/70 backdrop-blur-md text-white border-0">
          {/* Event Title */}
          <div className="p-4 sm:p-6 md:p-8 text-center">
            <motion.div 
              variants={fadeIn} 
              initial="hidden" 
              animate="visible"
              className="mb-8"
            >
              {/* Event name */}
              <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
              
              {/* Privacy Badge */}
              <div className="mb-6">
                {(() => {
                  const { icon, label, description, color, bgColor } = getPrivacyDetails(event.privacyLevel);
                  return (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${color} ${bgColor}`}>
                      <span className="mr-1">{icon}</span>
                      <span className="font-medium">{label}</span>
                      <span className="ml-2 text-xs opacity-75">{description}</span>
                 </div>
                  );
                })()}
             </div>

              {/* Host info */}
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={event.host.image || undefined} alt={event.host.name || "Host"} />
                  <AvatarFallback>{event.host.name?.[0] || "H"}</AvatarFallback>
                    </Avatar>
                <div>
                  <div className="text-sm text-muted-foreground">Hosted by</div>
                  <div className="font-medium">{event.host.name || "Unknown Host"}</div>
                </div>
             </div>
          </motion.div>

            <hr className="border-white/20 my-4 sm:my-6" />

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Date & Time Block */}
              <motion.div
                className="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-5 transition-all duration-200 shadow-sm group cursor-pointer"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/20 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 group-hover:bg-white/30 transition-colors">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                        </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-white group-hover:text-white/90 transition-colors truncate">{formatEventDate(event.date)}</div>
                  <div className="flex items-center text-xs sm:text-sm text-white/70">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                    <span className="truncate">
                      {formatEventTime(event.time)}
                      {event.duration && <span className="ml-1">· {event.duration} min</span>}
                    </span>
                        </div>
                    </div>
              </motion.div>

              {/* Location Block */}
              <motion.a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-5 transition-all duration-200 shadow-sm group cursor-pointer"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="bg-white/20 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 group-hover:bg-white/30 transition-colors">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                        </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-white group-hover:text-white/90 transition-colors truncate max-w-full">{event.location}</div>
                  <div className="flex items-center text-xs sm:text-sm text-white/70 group-hover:text-white/80 transition-colors">
                    <span>View on maps</span>
                            </div>
                        </div>
              </motion.a>
                    </div>

            <hr className="border-white/20 my-4 sm:my-6" />

            {/* Attendees */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm uppercase tracking-wide opacity-80 mb-3 sm:mb-4">ATTENDEES</h3>

              {/* Attendee Avatars */}
              <div className="flex justify-center mb-3 sm:mb-4">
                {event.attendees.filter(a => a.rsvp === "YES").slice(0, 5).map((attendee) => (
                  <Avatar
                    key={attendee.id}
                    className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-black/70 -ml-2 first:ml-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => router.push(`/users/${attendee.userId}`)}
                  >
                    <AvatarImage src={attendee.user.image || undefined} />
                    <AvatarFallback>{attendee.user.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                ))}

                {event.attendees.filter(a => a.rsvp === "YES").length > 5 && (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 -ml-2 flex items-center justify-center text-xs sm:text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() => setSelectedTab("attendees")}>
                    +{event.attendees.filter(a => a.rsvp === "YES").length - 5}
                                                </div>
                )}
              </div>

              {/* RSVP Buttons */}
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  variant={getUserRsvp() === "YES" ? "default" : "outline"}
                  className={getUserRsvp() === "YES"
                    ? "bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-8"
                    : "bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"}
                  onClick={() => handleRSVP("YES")}
                >
                  Going
                </Button>
                <Button
                  size="sm"
                  variant={getUserRsvp() === "MAYBE" ? "default" : "outline"}
                  className={getUserRsvp() === "MAYBE"
                    ? "bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm h-8"
                    : "bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"}
                  onClick={() => handleRSVP("MAYBE")}
                >
                  Maybe
                </Button>
                <Button
                  size="sm"
                  variant={getUserRsvp() === "NO" ? "default" : "outline"}
                  className={getUserRsvp() === "NO"
                    ? "bg-red-600 hover:bg-red-700 text-xs sm:text-sm h-8"
                    : "bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"}
                  onClick={() => handleRSVP("NO")}
                >
                  Cant Go
                </Button>
              </div>
            </div>

            <hr className="border-white/20 my-4 sm:my-6" />

                                            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"
                onClick={addToCalendar}
              >
                <CalendarPlus className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Add to Calendar</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.name,
                      text: `Check out this event: ${event.name}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    addToast({
                      title: "Link copied",
                      description: "Event link copied to clipboard",
                    });
                  }
                }}
              >
                <Share className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                Share
              </Button>

                                                    {isHost && (
                                                        <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"
                    onClick={() => setShowAddAttendeeModal(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                    Invite
                                                            </Button>
                  
                  <EventHostActions 
                    onEdit={() => setShowEditEventModal(true)}
                    onDelete={() => setShowDeleteDialog(true)}
                  />
                                                        </>
                                                    )}
                                                </div>
                                            </div>

          {/* Tabs for Extra Content */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-4 sm:p-6 pt-0">
            <TabsList className="bg-white/10 w-full flex">
              <TabsTrigger
                value="details"
                className="flex-1 data-[state=active]:bg-white/20 text-white text-xs sm:text-sm"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="attendees"
                className="flex-1 data-[state=active]:bg-white/20 text-white text-xs sm:text-sm"
              >
                Attendees
              </TabsTrigger>
              <TabsTrigger
                value="photos"
                className="flex-1 data-[state=active]:bg-white/20 text-white text-xs sm:text-sm"
              >
                Photos
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="text-white mt-4">
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-3">About This Event</h3>
                {event.description ? (
                  <p className="whitespace-pre-line text-sm sm:text-base">{event.description}</p>
                ) : (
                  <p className="opacity-60 text-sm sm:text-base">No description provided.</p>
                )}
              </motion.div>
                                </TabsContent>

                            {/* Attendees Tab */}
            <TabsContent value="attendees" className="text-white mt-4">
              <motion.div
                variants={slideIn}
                initial="hidden"
                animate="visible"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-green-600 text-white text-xs">
                    {event.attendees.filter(a => a.rsvp === "YES").length} Going
                  </Badge>
                  <Badge className="bg-amber-600 text-white text-xs">
                    {event.attendees.filter(a => a.rsvp === "MAYBE").length} Maybe
                  </Badge>
                  <Badge className="bg-red-600 text-white text-xs">
                    {event.attendees.filter(a => a.rsvp === "NO").length} Not Going
                  </Badge>
                </div>

                {event.attendees.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-40" />
                    <p className="opacity-70 text-sm">No attendees yet.</p>
                    <p className="text-xs sm:text-sm opacity-50 mt-1">Be the first to RSVP!</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {event.attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                        onClick={() => router.push(`/users/${attendee.userId}`)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-white/30 flex-shrink-0">
                            <AvatarImage src={attendee.user.image || undefined} />
                            <AvatarFallback>{attendee.user.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{attendee.user.name || 'Anonymous'}</p>
                            {attendee.user.username && (
                              <p className="text-xs opacity-70 truncate">@{attendee.user.username}</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={
                            attendee.rsvp === "YES" ? "bg-green-600" :
                              attendee.rsvp === "MAYBE" ? "bg-amber-600" :
                                "bg-red-600"
                          }
                        >
                          <span className="text-xs whitespace-nowrap">
                            {attendee.rsvp === "YES" ? "Going" :
                              attendee.rsvp === "MAYBE" ? "Maybe" : "Not Going"}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {isHost && (
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <Button
                      size="sm"
                      onClick={() => setShowAddAttendeeModal(true)}
                      variant="outline"
                      className="bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                      Invite People
                    </Button>
                  </div>
                )}
        </motion.div>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="text-white mt-4">
        <motion.div
            variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <EventPhotoGallery
                  eventId={id}
                  isHost={isHost}
                  isPastEvent={isPastEvent}
                  isAttending={isAttending || false}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
            </Card>
      </div>

      {/* Modals */}
      <AddAttendeeModal
        isOpen={showAddAttendeeModal}
        onClose={() => setShowAddAttendeeModal(false)}
        eventId={id}
        onAttendeeAdded={fetchEvent}
      />

      <EditEventModal
        eventId={event.id}
        isOpen={showEditEventModal}
        onClose={() => setShowEditEventModal(false)}
        onEventUpdated={fetchEvent}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 text-sm h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm h-9"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}