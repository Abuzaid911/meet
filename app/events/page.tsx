"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  hostId: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
        addToast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [addToast]);

  const handleCreateEvent = () => {
    if (session?.user) {
      router.push("/events/create");
    } else {
      router.push("/auth/signin");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        {session?.user && (
          <Button onClick={handleCreateEvent}>Create New Event</Button>
        )}
      </div>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="border p-4 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-2">{event.name}</h2>
              <p className="text-gray-600 mb-1">
                Date: {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-1">Time: {event.time}</p>
              <p className="text-gray-600 mb-1">Location: {event.location}</p>
              {event.description && (
                <p className="text-gray-700 mt-2">{event.description}</p>
              )}
              <Button
                className="mt-4"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p>No events available.</p>
      )}
    </div>
  );
}