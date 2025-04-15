"use client"

import { useState, useEffect } from "react"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { CalendarIcon, Clock, MapPin, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { fadeInUp } from "@/lib/animations"

// Event interface
interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  headerImageUrl?: string
  headerColor?: string
  attendees: Array<{ rsvp: string }>
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch upcoming events
  useEffect(() => {
    const getUpcomingEvents = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/events/public?limit=6')
        
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming events')
        }
        
        const data = await response.json()
        setEvents(data.slice(0, 6)) // Limit to 6 events
      } catch (err) {
        console.error('Error fetching upcoming events:', err)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }
    
    getUpcomingEvents()
  }, [])

  // Calculate if event is soon (within the next 3 days)
  const isEventSoon = (date: string) => {
    const eventDate = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(eventDate.getTime() - now.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && eventDate > now
  }
  
  // Calculate if event is popular (more than 10 attendees)
  const isEventPopular = (attendees: Array<{ rsvp: string }>) => {
    return attendees.filter(a => a.rsvp === 'YES').length >= 10
  }

  if (events.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No upcoming events found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden border rounded-lg shadow-sm">
                <div className="h-32 bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/events/${event.id}`}>
                  <Card className="overflow-hidden border transition-all hover:shadow-md h-full">
                    <div className="relative h-32">
                      {event.headerImageUrl ? (
                        <Image
                          src={event.headerImageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div 
                          className="absolute inset-0 bg-gradient-to-br from-primary/70 to-blue-600/70" 
                          style={{ backgroundColor: event.headerColor || '#4F46E5' }} 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-3">
                        <div className="absolute top-2 right-2 flex gap-2">
                          {isEventSoon(event.date) && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              Soon
                            </Badge>
                          )}
                          {isEventPopular(event.attendees) && (
                            <Badge className="bg-purple-500 text-white flex items-center gap-1 text-xs">
                              <TrendingUp className="h-3 w-3" /> Popular
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{event.name}</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <time dateTime={event.date}>
                          {format(new Date(event.date), 'EEE, MMM d')}
                        </time>
                        <span className="mx-1">•</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {event.attendees.filter(a => a.rsvp === 'YES').length} people attending
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  )
} 