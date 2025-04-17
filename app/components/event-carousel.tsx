"use client"

import { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent
} from './ui/card';
import {
  CalendarIcon,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  Search,
  X,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { format, isThisWeek, isThisMonth, isPast, formatDistance } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { debounce } from 'lodash';

// --- Interfaces (Same as before) ---
interface Attendee {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  rsvp: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  duration: number;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  attendees: Attendee[];
  headerType?: "color" | "image";
  headerColor?: string;
  headerImageUrl?: string;
}

interface EventCarouselProps {
  searchTerm?: string;
  filter?: string;
}

// --- Helper Functions (Same as before) ---
const getConfirmedAttendees = (attendees: Attendee[]) => {
  return attendees.filter(a => a.rsvp === 'YES').length;
};

const getRelativeTimeLabel = (dateStr: string) => {
  try {
    const eventDate = new Date(dateStr);
    if (isNaN(eventDate.getTime())) return "";
    return formatDistance(eventDate, new Date(), { addSuffix: true });
  } catch (e) {
    console.error("Error parsing date:", e);
    return "";
  }
};

const isEventSoon = (date: string) => {
  try {
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) return false;
    if (isPast(eventDate)) return false;
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays >= 0;
  } catch (e) {
    console.error("Error parsing date:", e);
    return false;
  }
};

const isEventPopular = (attendees: Attendee[]) => {
  return getConfirmedAttendees(attendees) >= 10;
};

const formatEventTime = (timeStr: string): string => {
  try {
    return timeStr; // Already in HH:MM format
  } catch (e) {
    console.error("Error formatting time:", e);
    return timeStr;
  }
};

// --- Main Component ---
export const EventCarousel = memo(({ searchTerm = "", filter = "all" }: EventCarouselProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localFilter, setLocalFilter] = useState(filter);

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  // --- Data Fetching --- // Changed to use /api/events/public
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchEvents = async () => {
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
  };

  const applyFilters = useCallback(
    debounce(() => {
      if (events.length === 0) return;
      let filtered = [...events];
      if (localSearchTerm.trim() !== '') {
        const searchLower = localSearchTerm.toLowerCase();
        filtered = filtered.filter(event =>
          event.name.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower) ||
          event.host.name?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower)
        );
      }
      try {
        if (localFilter === 'thisWeek') {
          filtered = filtered.filter(event =>
            !isPast(new Date(event.date)) &&
            isThisWeek(new Date(event.date), { weekStartsOn: 1 })
          );
        } else if (localFilter === 'thisMonth') {
          filtered = filtered.filter(event =>
            !isPast(new Date(event.date)) &&
            isThisMonth(new Date(event.date))
          );
        }
      } catch (e) {
        console.error("Date filtering error:", e);
      }
      setFilteredEvents(filtered);
      setCurrentIndex(0);
    }, 300),
    [events, localSearchTerm, localFilter]
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
    applyFilters();
  };

  const handleClearSearch = () => {
    setLocalSearchTerm("");
  };

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { setLocalSearchTerm(searchTerm); setLocalFilter(filter); }, [searchTerm, filter]);
  useEffect(() => { applyFilters(); }, [applyFilters]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Loading Events
          </h2>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-md border">
              <div className="relative h-64 overflow-hidden rounded-md bg-gray-100 animate-pulse" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (fetchError) {
    return (
      <Card className="bg-destructive/10 border-destructive/30 m-4">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4 opacity-80" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Events</h3>
            <p className="text-muted-foreground mb-4">{fetchError}</p>
            <Button onClick={fetchEvents} variant="destructive" size="sm">Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="space-y-4 p-4 sm:p-6 md:p-8">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          {/* ... (Same Search and Filter UI as before) ... */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={localSearchTerm}
              onChange={handleSearchInputChange}
              className="pl-8 pr-8 h-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary transition-all text-sm"
            />
            {localSearchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 h-10 min-w-[100px] border-border/50 bg-background/80 backdrop-blur-sm text-sm">
                <Filter className="h-4 w-4" />
                <span>
                  {localFilter === "all" && "All"}
                  {localFilter === "thisWeek" && "Week"}
                  {localFilter === "thisMonth" && "Month"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuItem onClick={() => setLocalFilter("all")} className="cursor-pointer text-sm">
                All Events
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocalFilter("thisWeek")} className="cursor-pointer text-sm">
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocalFilter("thisMonth")} className="cursor-pointer text-sm">
                This Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="border-border/40 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col items-center py-12 px-4 bg-gradient-to-b from-background to-muted/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="rounded-full bg-muted/60 p-4 mb-4">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/70" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold mb-2">
                  {localSearchTerm || localFilter !== 'all' ? "No Events Found" : "No Upcoming Events"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
                  {localSearchTerm && `We couldn't find events matching "${localSearchTerm}"`}
                  {localSearchTerm && localFilter !== 'all' && ' with the current filter.'}
                  {!localSearchTerm && localFilter !== 'all' &&
                    'There are no events matching the current filter.'}
                  {!localSearchTerm && localFilter === 'all' && 'Check back later or create a new event to get started!'}
                </p>

                {(localSearchTerm || localFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setLocalSearchTerm("");
                      setLocalFilter("all");
                    }}
                    variant="outline"
                    size="sm"
                    className="px-4 text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Carousel Render ---

  return (
    <div className="space-y-4 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={localSearchTerm}
            onChange={handleSearchInputChange}
            className="pl-8 pr-8 h-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary transition-all text-sm"
          />
          {localSearchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-10 min-w-[100px] border-border/50 bg-background/80 backdrop-blur-sm text-sm">
              <Filter className="h-4 w-4" />
              <span>
                {localFilter === "all" && "All"}
                {localFilter === "thisWeek" && "Week"}
                {localFilter === "thisMonth" && "Month"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuItem onClick={() => setLocalFilter("all")} className="cursor-pointer text-sm">
              All Events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocalFilter("thisWeek")} className="cursor-pointer text-sm">
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocalFilter("thisMonth")} className="cursor-pointer text-sm">
              This Month
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-4">
        {filteredEvents.slice(currentIndex, currentIndex + (isSmallScreen ? 2 : 3)).map((event, index) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          >
            <motion.div
              className="relative w-full rounded-md shadow-md border border-border/50 overflow-hidden bg-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {/* Event Header */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                {event.headerType === 'image' && event.headerImageUrl ? (
                  <Image
                    src={event.headerImageUrl}
                    alt={`Header image for ${event.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index < 2}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: event.headerColor || '#10b981' }}
                  />
                )}
                {/* Date Badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white p-1 rounded-md shadow-sm text-xs sm:text-sm">
                  <div>{format(new Date(event.date), 'MMM dd')}</div>
                  <div className="font-bold">{formatEventTime(event.time)}</div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {isEventSoon(event.date) && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none shadow-sm text-xs sm:text-sm" aria-label="Event is soon">
                      Soon
                    </Badge>
                  )}
                  {isEventPopular(event.attendees) && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none flex items-center gap-1 shadow-sm text-xs sm:text-sm" aria-label="Popular event">
                      <TrendingUp className="h-3 w-3" /> Popular
                    </Badge>
                  )}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" aria-hidden="true" />

                {/* Event Title */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <h3 className="text-white font-semibold text-sm sm:text-lg line-clamp-2 group-hover:text-primary-foreground transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                    by {event.host.name || 'Unknown Host'}
                  </p>
                </div>
              </div>

              <CardContent className="p-3 sm:p-4">
                <div className="space-y-1 text-xs sm:text-sm">
                  {/* Relative Time */}
                  <div className="font-medium text-primary mb-1">{getRelativeTimeLabel(event.date)}</div>

                  {/* Location */}
                  <div className="flex items-start">
                    <MapPin className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground" aria-hidden="true" />
                    <span className="line-clamp-1 flex-1">{event.location}</span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-start">
                    <Clock className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground" aria-hidden="true" />
                    {event.duration >= 60 ? (
                      <span>{Math.floor(event.duration / 60)} hr{Math.floor(event.duration / 60) !== 1 ? 's' : ''}</span>
                    ) : (
                      <span>{event.duration} min{event.duration !== 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {/* Attendees */}
                  <div className="flex items-start">
                    <Users className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground" aria-hidden="true" />
                    <span>
                      {getConfirmedAttendees(event.attendees)} going
                    </span>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Simple Pagination (Optional) */}
      {filteredEvents.length > 3 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 3))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentIndex(prev => Math.min(filteredEvents.length - 3, prev + 3))}
            disabled={currentIndex >= filteredEvents.length - 3}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
});

EventCarousel.displayName = "EventCarousel";