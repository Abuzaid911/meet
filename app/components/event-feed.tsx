"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { CalendarIcon, MapPin, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

interface Attendee {
  user: {
    id: string
    name: string
    image: string | null
  }
}

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description?: string
  duration: number
  host: {
    id: string
    name: string
    image: string | null
  }
  attendees: Attendee[]
}

export function EventFeed() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/events/public')
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Upcoming Events</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-1/3 bg-muted rounded" />
                <div className="h-4 w-1/4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">Upcoming Events</h2>
      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No upcoming events scheduled</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/events/${event.id}`}>
                <Card className="h-full transition-transform hover:scale-[1.02] hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-lg font-semibold">{event.name}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-teal-500" />
                        <time dateTime={event.date} className="text-muted-foreground">
                          {format(new Date(event.date), 'PPP')} at {event.time}
                        </time>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">{event.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-rose-500" />
                        <span className="text-muted-foreground">{event.location}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={event.host.image || undefined} />
                            <AvatarFallback>{event.host.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{event.host.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-violet-500" />
                          <span className="text-sm text-muted-foreground">{event.attendees.length}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}