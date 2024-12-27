'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { useSession } from 'next-auth/react'
import { useToast } from '../components/ui/use-toast'
import { Button } from '../components/ui/button'
import { AddEventModal } from './add-event-modal'

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  hostId: string
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const { addToast } = useToast()
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)

  const fetchEvents = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/events?userId=${session.user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      addToast('Failed to load events', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [session, addToast])

  const handleAddEvent = () => {
    setIsAddEventModalOpen(true)
  }

  const handleEventAdded = () => {
    fetchEvents()
  }

  if (isLoading) {
    return <div>Loading events...</div>
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">My Events</h3>
        <Button onClick={handleAddEvent}>Add Event</Button>
      </div>
      {events.length === 0 ? (
        <p>No upcoming events.</p>
      ) : (
        events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.name}</CardTitle>
              <CardDescription>{new Date(event.date).toLocaleDateString()} at {event.time}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{event.location}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {event.hostId === session?.user?.id ? 'You are hosting this event' : 'You are attending this event'}
              </p>
              <Link href={`/events/${event.id}`} className="text-primary hover:underline">
                View Details
              </Link>
            </CardContent>
          </Card>
        ))
      )}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onEventAdded={handleEventAdded}
      />
    </div>
  )
}

