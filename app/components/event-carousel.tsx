"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Card, 
  CardHeader, 
  CardContent
} from './ui/card'
import { 
  CalendarIcon, 
  MapPin, 
  Users, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { format, isThisWeek, isThisMonth, isPast } from 'date-fns'
import { motion, useAnimation, useMotionValue, PanInfo } from 'framer-motion'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'

// --- Interfaces ---
interface Attendee {
  user: {
    id: string
    name: string | null // Allow null name
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
  duration: number // Assuming duration is in hours
  host: {
    id: string
    name: string | null // Allow null name
    image: string | null
  }
  attendees: Attendee[]
  headerType?: "color" | "image"
  headerColor?: string
  headerImageUrl?: string 
}

interface EventCarouselProps {
  searchTerm?: string
  filter?: string
}

// --- Helper Functions ---
const getConfirmedAttendees = (attendees: Attendee[]) => {
  return attendees.filter(a => a.rsvp === 'YES').length;
};

const isEventSoon = (date: string) => {
  try {
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) return false; // Invalid date
    if (isPast(eventDate)) return false; // Don't mark past events as soon

    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays >= 0; // Within the next 3 days
  } catch (e) {
    console.error("Error parsing date for isEventSoon:", e);
    return false;
  }
};

const isEventPopular = (attendees: Attendee[]) => {
  return getConfirmedAttendees(attendees) >= 10; // Example threshold
};

// --- Main Component ---
export function EventCarousel({ searchTerm = "", filter = "all" }: EventCarouselProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const carouselControls = useAnimation()
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const isDragging = useRef(false)
  const dragX = useMotionValue(0)
  
  // Number of cards to show per page based on viewport width
  const getCardsPerPage = () => {
    if (typeof window === "undefined") return 3
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 1024) return 2
    return 3
  }
  
  const cardsPerPage = getCardsPerPage()
  const totalPages = Math.ceil(filteredEvents.length / cardsPerPage)

  // --- Autoplay Logic ---
  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay(); // Clear existing timer before starting a new one
    if (filteredEvents.length <= cardsPerPage) return; // No autoplay if not enough cards

    autoplayRef.current = setTimeout(() => {
      if (!isDragging.current) { // Only advance if not currently dragging
        const nextPage = (currentPage + 1) % totalPages;
        setCurrentPage(nextPage);
        carouselControls.start({
          x: -nextPage * (cardsPerPage * (320 + 16)), // Card width (320px) + gap (16px = gap-4)
          transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } // Smoother ease
        });
      }
      startAutoplay(); // Schedule next autoplay cycle
    }, 5000); // Autoplay interval: 5 seconds
  }, [currentPage, totalPages, cardsPerPage, filteredEvents.length, carouselControls, stopAutoplay]);

  // --- Data Fetching ---
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      const response = await fetch('/api/events/public');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setFetchError('Unable to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Effects ---

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Update current page if the window resize would cause the current page to be invalid
      if (currentPage >= totalPages && totalPages > 0) {
        setCurrentPage(Math.max(0, totalPages - 1))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentPage, totalPages])

  // Initial fetch
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Start/Stop autoplay based on events and interaction
  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay(); // Cleanup timer on unmount
  }, [startAutoplay, stopAutoplay, filteredEvents]); // Rerun when events change

  // Apply filtering logic
  useEffect(() => {
    if (isLoading) return; // Don't filter while loading initial data

    let filtered = [...events];

    // Apply search term filtering
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(lowercasedSearch) ||
        event.location.toLowerCase().includes(lowercasedSearch) ||
        event.host.name?.toLowerCase().includes(lowercasedSearch) || // Search host name
        event.description?.toLowerCase().includes(lowercasedSearch)
      );
    }

    // Apply time-based filtering
    try {
        if (filter === 'thisWeek') {
            filtered = filtered.filter(event => !isPast(new Date(event.date)) && isThisWeek(new Date(event.date), { weekStartsOn: 1 })); // Monday start
        } else if (filter === 'thisMonth') {
            filtered = filtered.filter(event => !isPast(new Date(event.date)) && isThisMonth(new Date(event.date)));
        }
    } catch(e) {
        console.error("Date filtering error:", e);
        // Optionally handle date parsing errors, maybe show all events
    }


    setFilteredEvents(filtered);
    // Reset to first page only if the page becomes invalid or if filters *meaningfully* change
    // This prevents jarring jumps if the filter results still contain the current view
    const newTotalPages = Math.ceil(filtered.length / cardsPerPage);
    if (currentPage >= newTotalPages) {
        setCurrentPage(0);
        carouselControls.start({ x: 0, transition: { duration: 0.3 } });
    }

  }, [searchTerm, filter, events, isLoading, cardsPerPage, currentPage, carouselControls]); // Added dependencies


  // --- Carousel Navigation Function ---
  const navigate = (direction: 'next' | 'prev') => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current)
    
    let nextPage = currentPage
    if (direction === 'next') {
      nextPage = (currentPage + 1) % totalPages
    } else {
      nextPage = currentPage === 0 ? totalPages - 1 : currentPage - 1
    }
    
    setCurrentPage(nextPage)
    carouselControls.start({
      x: -nextPage * (cardsPerPage * (320 + 16)), // Card width + gap
      transition: { duration: 0.5, ease: "easeInOut" }
    })
    
    startAutoplay()
  }

  // --- Drag End Logic ---
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = false
    
    const swipeThreshold = 50
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x < 0 ? 'next' : 'prev'
      navigate(direction)
    } else {
      // Snap back to current page
      carouselControls.start({ 
        x: -currentPage * (cardsPerPage * (320 + 16)),
        transition: { duration: 0.3 } 
      })
      startAutoplay()
    }
  }


  // --- Render Logic ---

  // Loading State Skeleton
  if (isLoading) {
    return (
      <div className="overflow-hidden">
        <div className="flex gap-4 pl-1 animate-pulse"> {/* Added pulse animation */}
          {[...Array(cardsPerPage)].map((_, i) => ( // Show skeletons based on cardsPerPage
            <Card key={i} className="flex-shrink-0 w-full sm:w-[320px] h-[320px] overflow-hidden border bg-card">
              <CardHeader className="pb-2"> {/* Adjusted padding */}
                <Skeleton className="h-5 w-3/5 mb-2" />
                <Skeleton className="h-4 w-2/5" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" /> <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" /> <Skeleton className="h-3 w-1/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" /> <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Skeleton className="h-4 w-4 rounded-full" /> <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-16 w-full mt-4" /> {/* Description Placeholder */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <Card className="bg-destructive/10 border-destructive/30">
        <CardContent className="pt-6 flex items-center justify-center">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive text-lg mb-4">{fetchError}</p>
            {/* Use Button component for consistency */}
            <Button
              onClick={() => fetchEvents()}
              variant="destructive"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (filteredEvents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center py-12 min-h-[250px] justify-center"> {/* Added min-height */}
            <CalendarIcon className="h-16 w-16 text-muted-foreground/50 mb-5" /> {/* Increased size/margin */}
            <p className="text-muted-foreground text-lg mb-2 font-medium">
              {searchTerm || filter !== 'all' ? "No Events Found" : "No Upcoming Events"}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              {searchTerm && `We couldn't find events matching "${searchTerm}"`}
              {searchTerm && filter !== 'all' && ' with the current filter.'}
              {!searchTerm && filter !== 'all' && 'There are no events matching the current filter.'}
              {!searchTerm && filter === 'all' && 'Check back later or create a new event!'}
            </p>
             {/* Use Button component for consistency */}
            {(searchTerm || filter !== 'all') && (
                 <Button
                     onClick={() => window.location.reload()} // Consider resetting state instead of reload
                     variant="ghost"
                     size="sm"
                     className="text-primary hover:text-primary/80"
                 >
                     Clear Search & Filters
                 </Button>
             )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Render Carousel ---
  return (
    <div className="relative pb-12">
      {/* Carousel Container with Mouse Enter/Leave for Autoplay Pause */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing" // Add grab cursors
        ref={carouselRef}
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
      >
        <motion.div
          className="flex gap-4 pl-1"
          animate={carouselControls}
          initial={{ x: 0 }}
          drag="x"
          dragConstraints={{ left: -(filteredEvents.length * 336 - cardsPerPage * 336), right: 0 }}
          style={{ x: dragX }}
          onDragStart={() => {
            isDragging.current = true
            if (autoplayRef.current) clearTimeout(autoplayRef.current)
          }}
          onDragEnd={handleDragEnd}
        >
          {/* Map through filtered events to render cards */}
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id + '-' + index}
              className="flex-shrink-0 w-full sm:w-[320px]"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.5,
                delay: 0.08 * (index % cardsPerPage),
                ease: [0.25, 1, 0.5, 1]
              }}
              whileHover={{
                y: -6,
                scale: 1.02,
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
                transition: { duration: 0.25, ease: "easeOut" }
              }}
            >
              <Link href={`/events/${event.id}`} className="block h-full">
                <Card className="h-full transition-all hover:shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 group relative">
                  {/* Full-size header with content overlay */}
                  <div className="relative h-full">
                    {/* Header background - either image or color */}
                    {event.headerType === "image" && event.headerImageUrl ? (
                      <div className="absolute inset-0 w-full h-full">
                        <Image 
                          src={event.headerImageUrl} 
                          alt={event.name} 
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70"></div>
                      </div>
                    ) : (
                      <div 
                        className="absolute inset-0 w-full h-full"
                        style={{ 
                          backgroundColor: event.headerColor || "#10b981"
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60"></div>
                      </div>
                    )}
                    
                    {/* Badges positioned at top-right */}
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      {isEventSoon(event.date) && (
                        <Badge className="bg-orange-500 text-white border-none">Soon</Badge>
                      )}
                      {isEventPopular(event.attendees) && (
                        <Badge className="bg-purple-500 text-white border-none flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Popular
                        </Badge>
                      )}
                    </div>
                    
                    {/* Content overlaid on the header */}
                    <div className="relative h-full flex flex-col pt-12 pb-4 px-4 text-white">
                      {/* Push content to bottom with flex */}
                      <div className="mt-auto">
                        <h3 className="text-xl font-bold mb-1 line-clamp-1 group-hover:text-teal-300 transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-sm text-white/80 mb-4 line-clamp-1">
                          Hosted by {event.host.name}
                        </p>
                        
                        <div className="space-y-2 text-sm backdrop-blur-sm bg-black/30 p-3 rounded-lg">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-teal-300" />
                            <span>{format(new Date(event.date), 'EEE, MMM d')}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-teal-300" />
                            <span>{event.time} · {event.duration}h</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-teal-300" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-teal-300" />
                            <span>{getConfirmedAttendees(event.attendees)} attending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Controls - Enhanced Styling */}
      {totalPages > 1 && ( // Only show controls if needed
        <div className="flex items-center justify-center gap-4 mt-8"> {/* Increased top margin */}
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('prev')}
            className="rounded-full h-8 w-8 border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
            aria-label="Previous events page"
            disabled={currentPage === 0} // Disable if on first page
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Pagination Dots */}
          <div className="flex gap-2 items-center">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i);
                  carouselControls.start({
                    x: -i * (cardsPerPage * (320 + 16)),
                    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                  });
                  stopAutoplay();
                  startAutoplay();
                }}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ease-in-out ${currentPage === i ? 'bg-primary scale-125' : 'bg-muted hover:bg-muted-foreground/50 scale-100'}`} // Enhanced styling
                aria-label={`Go to page ${i + 1}`}
                style={{ transitionDelay: `${i * 0.02}s` }} // Subtle delay effect
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('next')}
            className="rounded-full h-8 w-8 border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
            aria-label="Next events page"
            disabled={currentPage === totalPages - 1} // Disable if on last page
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
