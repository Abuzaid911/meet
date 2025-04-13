"use client";

import Link from "next/link";
import Image from "next/image";
import { format, isPast, isToday, addDays } from "date-fns";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock,
  MapPin,
  Users,
  CheckCircle,
  HelpCircle,
  X,
  TrendingUp
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

interface EventCardProps {
  id: string;
  name: string;
  date: string; // ISO string
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
  userRsvp?: 'YES' | 'NO' | 'MAYBE' | 'PENDING' | null;
  isHost?: boolean;
  headerType?: "color" | "image";
  headerColor?: string;
  headerImageUrl?: string;
  className?: string;
}

export function EnhancedEventCardCarousel({
  id,
  name,
  date,
  time,
  location,
  duration,
  host,
  attendees,
  userRsvp,
  isHost,
  headerType = "color",
  headerColor = "#10b981", // Default teal color
  headerImageUrl,
  className = "",
}: EventCardProps) {
  // Helper functions
  const getConfirmedAttendees = () => {
    return attendees.filter(a => a.rsvp === 'YES').length;
  };

  const isEventSoon = () => {
    try {
      const eventDate = new Date(date);
      if (isPast(eventDate)) return false;
      
      const threeDaysFromNow = addDays(new Date(), 3);
      return eventDate <= threeDaysFromNow;
    } catch (e) {
      console.error("Error parsing date:", e);
      return false;
    }
  };

  const isEventToday = () => {
    try {
      return isToday(new Date(date));
    } catch (e) {
      console.error("Error checking if event is today:", e);
      return false;
    }
  };

  const isPastEvent = () => {
    try {
      const eventDate = new Date(date);
      return isPast(eventDate);
    } catch (e) {
      console.error("Error checking if event is past:", e);
      return false;
    }
  };

  const isEventPopular = () => {
    return getConfirmedAttendees() >= 10;
  };

  // Get formatted date
  const getFormattedDate = () => {
    try {
      const eventDate = new Date(date);
      return format(eventDate, 'EEE, MMM d');
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date unavailable";
    }
  };

  // Determine the RSVP icon
  const getRsvpIcon = () => {
    if (!userRsvp) return null;
    
    switch(userRsvp) {
      case 'YES':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'MAYBE':
        return <HelpCircle className="h-4 w-4 text-amber-500" />;
      case 'NO':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Link 
      href={`/events/${id}`} 
      className={`block h-full ${className}`}
    >
      <motion.div
        className="h-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 group relative"
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        {/* Full-size header with content overlay */}
        <div className="relative h-full">
          {/* Header background - either image or color */}
          {headerType === "image" && headerImageUrl ? (
            <div className="absolute inset-0 w-full h-full">
              <Image 
                src={headerImageUrl} 
                alt={name} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70"></div>
            </div>
          ) : (
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backgroundColor: headerColor 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60"></div>
            </div>
          )}
          
          {/* Badges positioned at top-right */}
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            {isEventToday() && (
              <Badge className="bg-green-500 text-white border-none">Today</Badge>
            )}
            {!isEventToday() && isEventSoon() && (
              <Badge className="bg-orange-500 text-white border-none">Soon</Badge>
            )}
            {isEventPopular() && (
              <Badge className="bg-purple-500 text-white border-none flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Popular
              </Badge>
            )}
            {isPastEvent() && (
              <Badge variant="secondary" className="bg-white/20 text-white">Past</Badge>
            )}
            {isHost && (
              <Badge className="bg-blue-500 text-white border-none">Host</Badge>
            )}
          </div>
          
          {/* Content overlaid on the header */}
          <div className="relative h-full flex flex-col pt-12 pb-4 px-4 text-white">
            {/* Push content to bottom with flex */}
            <div className="mt-auto">
              <h3 className="text-xl font-bold mb-1 line-clamp-1 group-hover:text-teal-300 transition-colors">
                {name}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-5 w-5 border border-white/30">
                  <AvatarImage src={host.image || undefined} alt={host.name || ""} />
                  <AvatarFallback className="text-xs">{host.name?.[0] || "H"}</AvatarFallback>
                </Avatar>
                <p className="text-xs text-white/80">
                  {host.name || "Unknown"}
                </p>
              </div>
              
              <div className="space-y-2 text-sm backdrop-blur-sm bg-black/30 p-3 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-teal-300" />
                  <span>{getFormattedDate()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-teal-300" />
                  <span>{time} · {duration}m</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-teal-300" />
                  <span className="line-clamp-1">{location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-teal-300" />
                    <span>{getConfirmedAttendees()} attending</span>
                  </div>
                  {userRsvp && (
                    <div className="flex items-center">
                      {getRsvpIcon()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Export the carousel ready entry point
export function EventCarouselItem(props: EventCardProps) {
  return (
    <div className="flex-shrink-0 w-full sm:w-80 md:w-[320px] h-[380px]">
      <EnhancedEventCardCarousel {...props} className="h-full" />
    </div>
  );
}