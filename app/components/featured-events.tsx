"use client"

import { useState, useEffect } from "react"
import { Sparkles, CalendarIcon } from "lucide-react"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { fadeIn } from "@/lib/animations"

// Featured event interface
interface FeaturedEvent {
  id: string
  name: string
  date: string
  headerImageUrl?: string
  headerColor?: string
  attendees?: Array<{ rsvp: string }>
}

export default function FeaturedEvents() {
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch featured events
  useEffect(() => {
    const getFeaturedEvents = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/events/public?featured=true&limit=3')
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured events')
        }
        
        const data = await response.json()
        setFeaturedEvents(data.slice(0, 3)) // Limit to 3 events
      } catch (err) {
        console.error('Error fetching featured events:', err)
        // Fallback to empty array if error occurs
        setFeaturedEvents([])
      } finally {
        setIsLoading(false)
      }
    }
    
    getFeaturedEvents()
  }, [])

  if (featuredEvents.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-medium">Featured Events</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border rounded-lg shadow-sm">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            {featuredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/events/${event.id}`}>
                  <Card className="overflow-hidden border transition-all hover:shadow-md">
                    <div className="relative h-48">
                      {event.headerImageUrl ? (
                        <Image
                          src={event.headerImageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div 
                          className="absolute inset-0 bg-gradient-to-br from-primary/80 to-blue-600/80" 
                          style={{ backgroundColor: event.headerColor || '#4F46E5' }} 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                        <Badge className="bg-primary/80 backdrop-blur-sm absolute top-2 right-2 text-xs font-medium">
                          {event.attendees?.filter(a => a.rsvp === 'YES').length || 0} attending
                        </Badge>
                        <h3 className="text-white font-bold text-xl mb-1 line-clamp-1">{event.name}</h3>
                        <div className="flex items-center text-white/90 text-sm gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <time dateTime={event.date}>
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </time>
                        </div>
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