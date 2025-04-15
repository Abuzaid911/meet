"use client"

import { useState, useEffect } from "react"
import { Calendar } from "./ui/calendar"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { Alert, AlertDescription } from "./ui/alert"
import { Skeleton } from "./ui/skeleton"
import { CalendarIcon, RefreshCcw, Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { fadeIn } from "@/lib/animations"
import { format } from "date-fns"
import "./calendar-fix.css"

interface CalendarEvent {
  id: string
  name?: string
  title?: string // For Google Calendar events
  date: string
  time?: string
  location?: string
  headerColor?: string
  source?: string
  colorId?: string
}

interface MiniCalendarProps {
  onDateSelect?: (date: Date) => void
}

// Type for app events from API
interface AppEvent {
  id: string
  name: string
  title?: string
  date: string
  time?: string
  location?: string
  headerColor?: string
  source?: string
  colorId?: string
}

// Type for personal calendar events from API
interface PersonalEvent {
  id: string
  title: string
  name?: string
  date: string
  time?: string
  location?: string
  source?: string
  colorId?: string
}

export default function MiniCalendar({ onDateSelect }: MiniCalendarProps) {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendarView, setCalendarView] = useState<"app" | "all">("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch events when month changes or calendar view changes
  useEffect(() => {
    async function fetchEvents() {
      if (!month) return
      
      setIsLoading(true)
      setError(null)
      
      // First day of month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1)
      // Last day of month
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)
      
      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      try {
        // Fetch app events
        const appEventsPromise = fetch(`/api/events/calendar?startDate=${startDateStr}&endDate=${endDateStr}`)
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch app events')
            return res.json()
          })
          .catch(err => {
            console.error('Error fetching app events:', err)
            return []
          })
        
        // Fetch personal calendar events from Google/Apple if authenticated
        const personalEventsPromise = session?.user ? 
          fetch(`/api/calendar/events?startDate=${startDateStr}&endDate=${endDateStr}`)
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch personal calendar events')
              return res.json()
            })
            .catch(err => {
              console.error('Error fetching personal calendar events:', err)
              return []
            })
          : Promise.resolve([])
        
        // Wait for both requests to complete
        const [appEvents, personalEvents] = await Promise.all([appEventsPromise, personalEventsPromise])
        
        // Format and merge events
        const formattedAppEvents = (appEvents as AppEvent[]).map((event) => ({
          ...event,
          source: 'app',
          name: event.name || event.title
        }))
        
        const formattedPersonalEvents = (personalEvents as PersonalEvent[]).map((event) => ({
          ...event,
          name: event.title || event.name,
          source: event.source || 'personal'
        }))
        
        // Set events based on selected view
        if (calendarView === 'app') {
          setEvents(formattedAppEvents)
        } else {
          setEvents([...formattedAppEvents, ...formattedPersonalEvents])
        }
      } catch (err) {
        console.error('Error fetching calendar events:', err)
        setError('Failed to load calendar events')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEvents()
  }, [month, calendarView, session?.user])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!date) return []
    
    const dateString = format(date, 'yyyy-MM-dd')
    return events.filter(event => {
      // Handle different date formats
      const eventDate = new Date(event.date)
      const eventDateStr = format(eventDate, 'yyyy-MM-dd')
      return eventDateStr === dateString
    })
  }

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    if (onDateSelect) {
      onDateSelect(date)
    }
  }
  
  // Get date cell content - used to show event indicators in the calendar
  const getDayContent = (day: Date) => {
    const dayEvents = getEventsForDate(day)
    if (dayEvents.length === 0) return null
    
    return (
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5 mb-0.5">
        {dayEvents.slice(0, 3).map((event, i) => (
          <div 
            key={i}
            className="h-1.5 w-1.5 rounded-full" 
            style={{ 
              backgroundColor: event.source === 'google' 
                ? '#4285F4' 
                : event.source === 'app'
                  ? '#10b981'
                  : event.headerColor || '#14b8a6' 
            }}
          />
        ))}
        {dayEvents.length > 3 && (
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </div>
    )
  }

  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : []
  
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-medium">Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as "app" | "all")}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-2 h-6">All Calendars</TabsTrigger>
              <TabsTrigger value="app" className="text-xs px-2 h-6">App Events</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setMonth(new Date())}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <Card>
          <CardContent className="p-0 sm:p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              className="w-full"
              components={{
                DayContent: ({ date }) => (
                  <>
                    {date.getDate()}
                    {getDayContent(date)}
                  </>
                ),
              }}
            />
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </h3>
                {selectedDate && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={() => onDateSelect && onDateSelect(selectedDate)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Event
                  </Button>
                )}
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : eventsForSelectedDate.length > 0 ? (
                <div className="space-y-2">
                  {eventsForSelectedDate.map((event) => (
                    <div 
                      key={event.id} 
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1.5"
                          style={{ 
                            backgroundColor: event.source === 'google' 
                              ? '#4285F4' 
                              : event.source === 'app'
                                ? '#10b981'
                                : event.headerColor || '#14b8a6' 
                          }}
                        />
                        <div>
                          <p className="font-medium text-sm">{event.name || event.title}</p>
                          {event.time && (
                            <p className="text-xs text-muted-foreground">{event.time}</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No events for this date
                </div>
              )}
            </CardContent>
          </Card>
          
          {!session?.user ? (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">Connect Your Calendar</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to sync events from Google Calendar
                </p>
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full"
                  onClick={() => window.location.href = '/api/auth/signin'}
                >
                  Connect Calendar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Quick Add</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => onDateSelect && onDateSelect(selectedDate || new Date())}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create New Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
} 