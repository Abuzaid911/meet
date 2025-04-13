"use client";

import { useState } from "react";
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
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
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
}

export function EnhancedEventCard({
  id,
  name,
  date,
  time,
  location,
  description,
  duration,
  host,
  attendees,
  userRsvp,
  isHost,
  headerType = "color",
  headerColor = "#10b981", // Default teal color
  headerImageUrl,
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  // Format date
  const getFormattedDate = () => {
    try {
      const eventDate = new Date(date);
      return format(eventDate, 'EEE, MMM d, yyyy');
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date unavailable";
    }
  };

  // Get RSVP status badge
  const getRsvpBadge = () => {
    if (!userRsvp) return null;
    
    const badgeProps = {
      YES: { 
        label: "Going", 
        variant: "success" as const,
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      MAYBE: { 
        label: "Maybe", 
        variant: "warning" as const,
        icon: <HelpCircle className="h-3 w-3 mr-1" />
      },
      NO: { 
        label: "Not Going", 
        variant: "destructive" as const,
        icon: <X className="h-3 w-3 mr-1" />
      },
      PENDING: { 
        label: "Invited", 
        variant: "outline" as const,
        icon: null
      }
    };
    
    const { label, variant, icon } = badgeProps[userRsvp];
    
    return (
      <Badge variant={variant} className="absolute top-2 left-2 flex items-center">
        {icon}{label}
      </Badge>
    );
  };

  return (
    <Link href={`/events/${id}`}>
      <Card 
        className="overflow-hidden border hover:shadow-md transition-all h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Header */}
        <div className="relative w-full h-40">
          {/* Header background */}
          {headerType === "image" && headerImageUrl ? (
            <div className="w-full h-full relative">
              <Image 
                src={headerImageUrl} 
                alt={name} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
            </div>
          ) : (
            <div 
              className="w-full h-full" 
              style={{ backgroundColor: headerColor }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50"></div>
            </div>
          )}
          
          {/* Status Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
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
              <Badge variant="secondary">Past</Badge>
            )}
          </div>
          
          {/* User RSVP Status */}
          {getRsvpBadge()}
          
          {/* Event Host */}
          {isHost && (
            <Badge 
              className="absolute bottom-2 right-2 bg-blue-500 border-none text-white"
            >
              You are hosting
            </Badge>
          )}
          
          {/* Event Name Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="text-xl font-semibold line-clamp-2">{name}</h3>
          </div>
        </div>
        
        {/* Card Content */}
        <CardContent className="p-4">
          {/* Host */}
          <div className="flex items-center mb-3">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={host.image || undefined} alt={host.name || ""} />
              <AvatarFallback>{host.name?.[0] || "H"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Hosted by {host.name || "Unknown"}</span>
          </div>
          
          {/* Event Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <Calendar className="h-4 w-4 mr-2 text-primary mt-0.5" />
              <span>{getFormattedDate()}</span>
            </div>
            <div className="flex items-start">
              <Clock className="h-4 w-4 mr-2 text-primary mt-0.5" />
              <span>{time} ({duration} min)</span>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 text-primary mt-0.5" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-start">
              <Users className="h-4 w-4 mr-2 text-primary mt-0.5" />
              <span>{getConfirmedAttendees()} attending</span>
            </div>
          </div>
          
          {/* Description Preview */}
          {description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
          )}
          
          {/* View Button - Appears on Hover */}
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              variant="outline" 
              className="w-full text-primary border-primary/30 hover:border-primary"
            >
              View Details
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Export a default component that includes the Grid
export function EnhancedEventGrid() {
  // This is just a stub to satisfy the import in the other files
  // The actual implementation is in another file
  return <div>EnhancedEventGrid</div>;
}