"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Loader2, Trash2, Calendar, Clock, MapPin, Users } from "lucide-react";
import { AttendeeList } from "../components/attendee-list";
import { AddAttendeeModal } from "../components/add-attendee-modal";
import { EventAttendance } from "../components/enhanced-event-attendance";
import { format } from "date-fns";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  duration: number;
  hostId: string;
  host: {
    id: string;
    name: string;
    image: string | null;
  };
  attendees: {
    id: string;
    rsvp: string;
    user: {
      id: string;
      name: string;
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
        <p className="text-gray-500 mb-4">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => router.push("/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  const isHost = session?.user?.id === event.hostId;
  const eventDate = new Date(event.date);

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-400 to-blue-500 p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
              <p className="text-white opacity-90">
                Hosted by {event.host.name}
              </p>
            </div>
            
            <div className="p-6">
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
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-teal-500" />
                  <div>
                    <p className="text-sm text-gray-500">Attendees</p>
                    <p className="font-medium">
                      {event.attendees.filter(a => a.rsvp === "YES").length} going
                    </p>
                  </div>
                </div>
              </div>
              
              {event.description && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">About this event</h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{event.description}</p>
                </div>
              )}
              
              {isHost && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex flex-wrap gap-4">
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
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Attendee List Section */}
          <div className="mt-8">
            <AttendeeList eventId={event.id} isHost={isHost} />
          </div>
        </div>
        
        {/* RSVP Section */}
        <div>
          <EventAttendance eventId={event.id} />
        </div>
      </div>

      {/* Invite Attendees Modal */}
      <AddAttendeeModal
        isOpen={showAddAttendeeModal}
        onClose={() => setShowAddAttendeeModal(false)}
        eventId={event.id}
        onAttendeeAdded={handleAttendeeAdded}
      />

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