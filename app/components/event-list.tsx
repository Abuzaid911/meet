"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"

interface Event {
  id: string
  name: string
  date: string // ✅ Store as string to avoid serialization issues
  time: string
  location: string
  description?: string
  duration: number // ✅ Added duration
  hostId: string
}

export function EventList() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/events")
      if (!response.ok) throw new Error("Failed to fetch events")
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
      addToast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete event")

      addToast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "success",
      })

      // Refresh the event list after deletion
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error("Error deleting event:", error)
      addToast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <p className="text-center text-gray-500">Loading events...</p>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-500">No events found</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <p className="text-sm text-gray-600">
                📅 {new Date(event.date).toLocaleDateString()} 🕒 {event.time}
              </p>
              <p className="text-sm text-gray-600">📍 {event.location}</p>
              <p className="text-sm text-gray-700">{event.description || "No description available."}</p>
              <p className="text-sm font-semibold text-gray-800">
                ⏳ Duration: {event.duration} minutes
              </p>

              {/* Show delete button only if the user is the host */}
              {session?.user?.id === event.hostId && (
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={() => handleDeleteEvent(event.id)}
                >
                  Delete Event
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}