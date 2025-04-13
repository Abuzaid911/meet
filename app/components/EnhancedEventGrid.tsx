"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Search,
  CalendarIcon,
  Filter,
  PlusCircle,
  Loader2
} from "lucide-react";

import { EnhancedEventCard} from "../components/EnhancedEventCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../components/ui/dropdown-menu";
import { useToast } from "../components/ui/use-toast";
import { AddEventModal } from "../components/add-event-modal";

// Interfaces
interface Attendee {
  id: string;
  rsvp: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
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

interface EnhancedEventGridProps {
  title?: string;
  showAddButton?: boolean;
  initialFilter?: 'all' | 'hosting' | 'attending' | 'upcoming' | 'past';
  className?: string;
}

export function EnhancedEventGrid({
  title = "Events",
  showAddButton = true,
  initialFilter = 'all',
  className = "",
}: EnhancedEventGridProps) {
  const { data: session } = useSession();
  const { addToast } = useToast();
  
  // States
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>(initialFilter);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  // Fetch events data
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const endpoint = session?.user?.id 
          ? `/api/events?userId=${session.user.id}` 
          : `/api/events/public`;
          
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        addToast({
          title: "Error",
          description: "Failed to load events. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [session, addToast]);
  
  // Filter events based on search term and filter option
  useEffect(() => {
    if (!events.length) return;
    
    let result = [...events];
    
    // Apply text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(event => 
        event.name.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        (event.description && event.description.toLowerCase().includes(term))
      );
    }
    
    // Apply filter
    const userId = session?.user?.id;
    if (userId) {
      switch (filter) {
        case 'hosting':
          result = result.filter(event => event.host.id === userId);
          break;
        case 'attending':
          result = result.filter(event => 
            event.attendees.some(a => a.user.id === userId && a.rsvp === 'YES')
          );
          break;
        case 'upcoming':
          result = result.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= new Date();
          });
          break;
        case 'past':
          result = result.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate < new Date();
          });
          break;
        // 'all' filter doesn't need additional filtering
      }
    }
    
    // Sort by date (upcoming first)
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setFilteredEvents(result);
  }, [events, searchTerm, filter, session]);
  
  // Handle event creation
  const handleAddEvent = () => {
    setIsAddEventModalOpen(true);
  };
  
  const handleEventAdded = () => {
    setIsAddEventModalOpen(false);
    
    // Refetch events
    setIsLoading(true);
    fetch(`/api/events?userId=${session?.user?.id}`)
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        addToast({
          title: "Success",
          description: "Event created successfully!",
          variant: "success",
        });
      })
      .catch(err => {
        console.error("Error refreshing events:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Get user RSVP status for an event
  const getUserRsvpStatus = (event: Event) => {
    if (!session?.user?.id) return null;
    
    const userAttendance = event.attendees.find(a => a.user.id === session.user.id);
    return userAttendance?.rsvp as 'YES' | 'NO' | 'MAYBE' | 'PENDING' | null;
  };
  
  // Check if user is host
  const isUserHost = (event: Event) => {
    return session?.user?.id === event.host.id;
  };

  return (
    <div className={className}>
      {/* Header with search and filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          {title}
          {filteredEvents.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredEvents.length})
            </span>
          )}
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-grow sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter Events</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilter('all')}
                className={filter === 'all' ? "bg-muted" : ""}
              >
                All Events
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter('upcoming')}
                className={filter === 'upcoming' ? "bg-muted" : ""}
              >
                Upcoming Events
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter('past')}
                className={filter === 'past' ? "bg-muted" : ""}
              >
                Past Events
              </DropdownMenuItem>
              {session?.user?.id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setFilter('hosting')}
                    className={filter === 'hosting' ? "bg-muted" : ""}
                  >
                    Events Im Hosting
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilter('attending')}
                    className={filter === 'attending' ? "bg-muted" : ""}
                  >
                    Events Im Attending
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Add Event Button */}
          {showAddButton && session?.user && (
            <Button onClick={handleAddEvent}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      </div>
      
      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading events...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? `No events match your search term "${searchTerm}"`
              : filter !== 'all'
                ? `No events found with the current filter`
                : `There are no events to display`
            }
          </p>
          {session?.user && (
            <Button onClick={handleAddEvent}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Event
            </Button>
          )}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredEvents.map((event) => (
            <motion.div 
              key={event.id}
              variants={itemVariants}
            >
              <EnhancedEventCard 
                {...event}
                userRsvp={getUserRsvpStatus(event)}
                isHost={isUserHost(event)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
}