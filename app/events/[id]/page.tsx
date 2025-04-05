"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
import { 
  Loader2, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit,
  ArrowLeft,
} from "lucide-react";
import { EventAttendees } from "../../components/event-attendees";
import { AddAttendeeModal } from "../../components/add-attendee-modal";
import { EditEventModal } from "../../components/edit-event-modal";
import { EventAttendance } from "../../components/enhanced-event-attendance";
import { ShareEventButton } from "../../components/share-event-button";
import { UserCard } from "../../components/user-card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card, CardContent } from "../../components/ui/card";
import { format, isPast, isToday, addMinutes } from "date-fns";
import { Badge } from "../../components/ui/badge";
import { AddToCalendarButton } from "../../components/add-to-calendar-button";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  lat: number;
  lng: number;
  description: string;
  duration: number;
  hostId: string;
  host: {
    id: string;
    name: string;
    username?: string;
    image: string | null;
  };
  attendees: {
    id: string;
    rsvp: string;
    user: {
      id: string;
      name: string;
      username?: string;
      image: string | null;
    };
  }[];
}

export default function EventPage() {
  const { id } = useParams(); // Get the event ID from the URL
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState("details");
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
        addToast({
          title: "Error",
          description: "Failed to load event",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, addToast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      addToast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "success",
      });
      router.push("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
      addToast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAttendeeAdded = () => {
    // Refresh the event data to show the new attendee
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    fetchEvent();
  };

  const handleEventUpdated = () => {
    setShowEditEventModal(false);
    // Refresh event data
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    fetchEvent();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading event details...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h2 className="text-2xl font-bold text-gray-700">Event not found</h2>
        <p className="text-gray-500 mb-4">The event you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push("/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  const isHost = session?.user?.id === event.hostId;
  const eventDate = new Date(event.date);
  const eventEndTime = addMinutes(new Date(`${event.date}T${event.time}`), event.duration);
  const isPastEvent = isPast(eventEndTime);
  const isActiveEvent = isToday(eventDate) && !isPast(eventEndTime);
  
  const confirmedAttendees = event.attendees.filter(a => a.rsvp === "YES");
  const maybeAttendees = event.attendees.filter(a => a.rsvp === "MAYBE");

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="flex items-center mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Information */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-teal-400 to-blue-500 p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {isPastEvent ? (
                    <Badge variant="secondary" className="mr-2 bg-gray-200 text-gray-700">Past Event</Badge>
                  ) : isActiveEvent ? (
                    <Badge className="mr-2 bg-green-500 text-white animate-pulse">Happening Now</Badge>
                  ) : (
                    <Badge className="mr-2 bg-blue-500 text-white">Upcoming</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white">{event.name}</h1>
                <Link 
                  href={`/users/${event.host.id}`} 
                  className="flex items-center mt-2 text-white/90 hover:text-white"
                >
                  <Avatar className="h-6 w-6 mr-2 border border-white/20">
                    <AvatarImage src={event.host?.image || undefined} />
                    <AvatarFallback>{event.host?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  Hosted by {event.host?.name || "Unknown"}
                </Link>
              </div>
              
              {/* Share Button in Header */}
              <ShareEventButton 
                eventId={event.id.toString()} 
                eventName={event.name} 
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                size="sm"
              />
            </div>
            
            <Tabs defaultValue="details" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="m-4 bg-gray-100 dark:bg-gray-800 p-1">
                <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Details
                </TabsTrigger>
                <TabsTrigger value="attendees" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Attendees ({confirmedAttendees.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="p-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-teal-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-teal-500" />
                    <div>
                      <p className="text-sm text-gray-500">Time & Duration</p>
                      <p className="font-medium">{event.time} ({event.duration} minutes)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-teal-500" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <a 
                        href={event.lat && event.lng 
                          ? `https://www.google.com/maps?q=${event.lat},${event.lng}` 
                          : `https://www.google.com/maps?q=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                      >
                        {event.location}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-teal-500" />
                    <div>
                      <p className="text-sm text-gray-500">Attendees</p>
                      <div className="font-medium flex items-center">
                        <span className="mr-2">{confirmedAttendees.length} going</span>
                        {maybeAttendees.length > 0 && (
                          <span className="text-sm text-gray-500">
                            ({maybeAttendees.length} maybe)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {event.description && (
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-3">About this event</h2>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{event.description}</p>
                  </div>
                )}
                
                {/* Host information */}
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Hosted by</h2>
                  <UserCard 
                    user={{
                      id: event.host.id,
                      name: event.host.name,
                      username: event.host.username || event.host.name.toLowerCase().replace(/\s+/g, ''),
                      image: event.host.image
                    }}
                    variant="inline"
                    showBio={false}
                    showEvents={false}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="mt-8 border-t pt-6">
                  <div className="flex flex-wrap gap-4">
                    {/* Add to Calendar */}
                    <AddToCalendarButton
                      event={{
                        name: event.name,
                        description: event.description,
                        date: event.date,
                        time: event.time,
                        duration: event.duration,
                        location: event.location
                      }}
                    />
                    
                    {/* Share Button */}
                    <ShareEventButton 
                      eventId={event.id.toString()} 
                      eventName={event.name} 
                    />
                    
                    {/* Host-only buttons */}
                    {isHost && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setShowEditEventModal(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Event
                        </Button>
                        
                        <Button
                          variant="secondary"
                          onClick={() => setShowAddAttendeeModal(true)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Invite Friends
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete Event
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attendees" className="min-h-[300px]">
                <CardContent>
                  <EventAttendees eventId={event.id} isHost={isHost} />
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* RSVP Section & Other Information */}
        <div className="space-y-6">
          {/* RSVP Widget */}
          <EventAttendance eventId={event.id} />
          
          {/* Similar Events (if any) */}
          {!isPastEvent && (
            <Card className="overflow-hidden shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-teal-500" />
                  Similar Events
                </h3>
                
                <div className="text-sm text-gray-500 text-center py-8">
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invite Attendees Modal */}
      <AddAttendeeModal
        isOpen={showAddAttendeeModal}
        onClose={() => setShowAddAttendeeModal(false)}
        eventId={event.id}
        onAttendeeAdded={handleAttendeeAdded}
      />
      
      {/* Edit Event Modal */}
      {showEditEventModal && (
        <EditEventModal
          eventId={event.id}
          onClose={() => setShowEditEventModal(false)}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this event?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}