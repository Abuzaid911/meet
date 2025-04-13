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

// App Components
import { AddAttendeeModal } from "@/app/components/add-attendee-modal";
import { EditEventModal } from "@/app/components/edit-event-modal";
import { EventPhotoGallery } from "@/app/components/event-photos";

// Icons
import {
  Loader2,
  Trash2,
  Edit,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Clock,
  Share,
  CalendarPlus,
  UserPlus,
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
        <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
      </div>

      {/* Back button */}
      <div className="fixed top-4 left-4 z-10">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="bg-black/30 hover:bg-black/40 text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-16 relative z-10">
        <Card className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-black/70 backdrop-blur-md text-white border-0">
          {/* Event Title */}
          <div className="p-6 md:p-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {event.name}
            </h1>

            {/* Host Info */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="text-sm uppercase tracking-wide opacity-80 mb-2">HOSTED BY</div>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src={event.host.image || undefined} />
                  <AvatarFallback>{event.host.name?.[0] || 'H'}</AvatarFallback>
                </Avatar>
                <div className="ml-3 text-left">
                  <h3 className="text-xl font-medium">{event.host.name || 'Anonymous'}</h3>
                  {isHost && (
                    <div className="flex mt-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditEventModal(true)}
                        className="bg-transparent border-white/30 hover:bg-white/10 text-white"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="bg-transparent border-red-500/50 hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-white/20 my-6" />

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date & Time Block */}
              <motion.div
                className="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-5 transition-all duration-200 shadow-sm group cursor-pointer"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/20 rounded-full p-3 mr-4 group-hover:bg-white/30 transition-colors">
                  <Calendar className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-lg sm:text-xl font-semibold text-white group-hover:text-white/90 transition-colors">{formatEventDate(event.date)}</div>
                  <div className="flex items-center text-sm text-white/70">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    {formatEventTime(event.time)}
                    {event.duration && <span className="ml-1">· {event.duration} min</span>}
                  </div>
                </div>
              </motion.div>

              {/* Location Block */}
              <motion.a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-5 transition-all duration-200 shadow-sm group cursor-pointer"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="bg-white/20 rounded-full p-3 mr-4 group-hover:bg-white/30 transition-colors">
                  <MapPin className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="text-lg sm:text-xl font-semibold text-white group-hover:text-white/90 transition-colors truncate max-w-full">{event.location}</div>
                  <div className="flex items-center text-sm text-white/70 group-hover:text-white/80 transition-colors">
                    <span>View on maps</span>
                  </div>
                </div>
              </motion.a>
            </div>

            <hr className="border-white/20 my-6" />

            {/* Attendees */}
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wide opacity-80 mb-4">ATTENDEES</h3>

              {/* Attendee Avatars */}
              <div className="flex justify-center mb-4">
                {event.attendees.filter(a => a.rsvp === "YES").slice(0, 5).map((attendee) => (
                  <Avatar
                    key={attendee.id}
                    className="h-12 w-12 border-2 border-black/70 -ml-2 first:ml-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => router.push(`/users/${attendee.userId}`)}
                  >
                    <AvatarImage src={attendee.user.image || undefined} />
                    <AvatarFallback>{attendee.user.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                ))}

                {event.attendees.filter(a => a.rsvp === "YES").length > 5 && (
                  <div className="h-12 w-12 rounded-full bg-white/20 -ml-2 flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() => setSelectedTab("attendees")}>
                    +{event.attendees.filter(a => a.rsvp === "YES").length - 5}
                  </div>
                )}
              </div>

              {/* RSVP Buttons */}
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  variant={getUserRsvp() === "YES" ? "default" : "outline"}
                  className={getUserRsvp() === "YES"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-transparent border-white/30 hover:bg-white/10 text-white"}
                  onClick={() => handleRSVP("YES")}
                >
                  Going
                </Button>
                <Button
                  variant={getUserRsvp() === "MAYBE" ? "default" : "outline"}
                  className={getUserRsvp() === "MAYBE"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-transparent border-white/30 hover:bg-white/10 text-white"}
                  onClick={() => handleRSVP("MAYBE")}
                >
                  Maybe
                </Button>
                <Button
                  variant={getUserRsvp() === "NO" ? "default" : "outline"}
                  className={getUserRsvp() === "NO"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-transparent border-white/30 hover:bg-white/10 text-white"}
                  onClick={() => handleRSVP("NO")}
                >
                  Cant Go
                </Button>
              </div>
            </div>

            <hr className="border-white/20 my-6" />

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="bg-transparent border-white/30 hover:bg-white/10 text-white"
                onClick={addToCalendar}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-white/30 hover:bg-white/10 text-white"
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
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>

              {isHost && (
                <Button
                  variant="outline"
                  className="bg-transparent border-white/30 hover:bg-white/10 text-white"
                  onClick={() => setShowAddAttendeeModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              )}
            </div>
          </div>

          {/* Tabs for Extra Content */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-6 pt-0">
            {/* TabsList contains only the tab buttons/triggers */}
            <TabsList className="bg-white/10">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-white/20 text-white"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="attendees"
                className="data-[state=active]:bg-white/20 text-white"
              >
                Attendees
              </TabsTrigger>
              <TabsTrigger
                value="photos"
                className="data-[state=active]:bg-white/20 text-white"
              >
                Photos
              </TabsTrigger>
            </TabsList>

            {/* TabsContent sections contain the actual content for each tab */}
            <TabsContent value="details">
              {event.description ? (
                <p className="whitespace-pre-line text-white">{event.description}</p>
              ) : (
                <p className="opacity-60 text-white">No description provided.</p>
              )}
            </TabsContent>

            {/* Details Tab */}
            {/* <TabsContent value="details" className="text-white mt-4">
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <h3 className="text-xl font-semibold mb-3">About This Event</h3>
                {event.description ? (
                  <p className="whitespace-pre-line">{event.description}</p>
                ) : (
                  <p className="opacity-60">No description provided.</p>
                )}

                <div className="mt-6 pt-6 border-t border-white/20">
                  <h3 className="text-xl font-semibold mb-3">Event Details</h3>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-3 text-white/80 mt-0.5" />
                      <div>
                        <p className="text-sm opacity-70">Duration</p>
                        <p className="font-medium">{event.duration} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-white/80 mt-0.5" />
                      <div>
                        <p className="text-sm opacity-70">Location</p>
                        <p className="font-medium">{event.location}</p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm mt-1 text-blue-400"
                          onClick={() => {
                            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
                            window.open(mapUrl, '_blank');
                          }}
                        >
                          View Map
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent> */}

            {/* Attendees Tab */}
            <TabsContent value="attendees" className="text-white mt-4">
              <motion.div
                variants={slideIn}
                initial="hidden"
                animate="visible"
              >
                <div className="flex gap-2 mb-4">
                  <Badge className="bg-green-600 text-white">
                    {event.attendees.filter(a => a.rsvp === "YES").length} Going
                  </Badge>
                  <Badge className="bg-amber-600 text-white">
                    {event.attendees.filter(a => a.rsvp === "MAYBE").length} Maybe
                  </Badge>
                  <Badge className="bg-red-600 text-white">
                    {event.attendees.filter(a => a.rsvp === "NO").length} Not Going
                  </Badge>
                </div>

                {event.attendees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="opacity-70">No attendees yet.</p>
                    <p className="text-sm opacity-50 mt-1">Be the first to RSVP!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {event.attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                        onClick={() => router.push(`/users/${attendee.userId}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-white/30">
                            <AvatarImage src={attendee.user.image || undefined} />
                            <AvatarFallback>{attendee.user.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{attendee.user.name || 'Anonymous'}</p>
                            {attendee.user.username && (
                              <p className="text-sm opacity-70">@{attendee.user.username}</p>
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
                          {attendee.rsvp === "YES" ? "Going" :
                            attendee.rsvp === "MAYBE" ? "Maybe" : "Not Going"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {isHost && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={() => setShowAddAttendeeModal(true)}
                      variant="outline"
                      className="bg-transparent border-white/30 hover:bg-white/10 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}