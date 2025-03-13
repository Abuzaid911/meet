"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { 
  CalendarIcon, 
  MapPin, 
  Users, 
  Clock, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { format, isThisWeek, isThisMonth } from 'date-fns'
import { motion } from 'framer-motion'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'

interface Attendee {
  user: {
    id: string
    name: string
    image: string | null
  }
  rsvp: string
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

interface EventFeedProps {
  searchTerm?: string
  filter?: string
}

export function EventFeed({ searchTerm = "", filter = "all" }: EventFeedProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setFetchError(null)
      const response = await fetch('/api/events/public')
      
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      console.error('Error fetching events:', err)
      setFetchError('Unable to load events. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Apply combined filtering based on search term and filter selection
  useEffect(() => {
    if (events.length === 0) return
    
    let filtered = [...events]
    
    // Apply search term filtering
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(lowercasedSearch) ||
        event.location.toLowerCase().includes(lowercasedSearch) ||
        event.description?.toLowerCase().includes(lowercasedSearch)
      )
    }
    
    // Apply time-based filtering
    if (filter === 'thisWeek') {
      filtered = filtered.filter(event => isThisWeek(new Date(event.date)))
    } else if (filter === 'thisMonth') {
      filtered = filtered.filter(event => isThisMonth(new Date(event.date)))
    } else if (filter === 'nearby') {
      // This would normally use geolocation - for demo, we'll just show random events
      filtered = filtered.sort(() => Math.random() - 0.5).slice(0, Math.max(3, Math.floor(filtered.length / 2)))
    }
    
    setFilteredEvents(filtered)
  }, [searchTerm, filter, events])

  // Get the number of confirmed (YES) attendees
  const getConfirmedAttendees = (attendees: Attendee[]) => {
    return attendees.filter(a => a.rsvp === 'YES').length
  }

  // Calculate if event is soon (within the next 3 days)
  const isEventSoon = (date: string) => {
    const eventDate = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(eventDate.getTime() - now.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && eventDate > now
  }
  
  // Calculate if event is popular (more than 10 attendees)
  const isEventPopular = (attendees: Attendee[]) => {
    return getConfirmedAttendees(attendees) >= 10
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-0">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3 mt-4">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-20 w-full mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="pt-6 flex items-center justify-center">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{fetchError}</p>
            <button 
              onClick={() => fetchEvents()}
              className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-300 mb-4" />
              {searchTerm || filter !== 'all' ? (
                <div>
                  <p className="text-muted-foreground text-lg mb-2">No events found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {searchTerm && `No results for "${searchTerm}"`}
                    {searchTerm && filter !== 'all' && ' with the current filter.'}
                    {!searchTerm && filter !== 'all' && 'No events found with the current filter.'}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 text-sm text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Clear filters and try again
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground text-lg">No upcoming events scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
            {filter !== 'all' && ` in the selected time period`}
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="h-full"
              >
                <Link href={`/events/${event.id}`} className="block h-full">
                  <Card className="h-full transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden border-gray-200 dark:border-gray-800 group">
                    <div className="bg-gradient-to-r from-teal-400/10 to-blue-500/10 dark:from-teal-500/20 dark:to-blue-600/20 px-2 py-1">
                      <div className="flex justify-end gap-2">
                        {isEventSoon(event.date) && (
                          <Badge className="bg-orange-500 text-white border-none">Soon</Badge>
                        )}
                        {isEventPopular(event.attendees) && (
                          <Badge className="bg-purple-500 text-white border-none flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="line-clamp-1 text-lg font-semibold group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {event.name}
                      </CardTitle>
                      <CardDescription className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-teal-500" />
                          <time dateTime={event.date} className="text-muted-foreground">
                            {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                          </time>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">
                            {event.time} ({event.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-rose-500" />
                          <span className="text-muted-foreground line-clamp-1">{event.location}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-gray-200 dark:border-gray-700">
                              <AvatarImage src={event.host.image || undefined} />
                              <AvatarFallback>{event.host.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{event.host.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                            <Users className="h-3 w-3 text-violet-500" />
                            <span className="text-xs font-medium">{getConfirmedAttendees(event.attendees)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center group-hover:underline">
                            View details <ArrowRight className="ml-1 h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {filteredEvents.length > 6 && (
            <div className="mt-8 text-center">
              <Button 
                className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
                onClick={() => {/* Load more logic */}}
              >
                Load More Events
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}