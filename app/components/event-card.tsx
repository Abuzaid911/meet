"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { CalendarIcon, MapPin, Share2, Users, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EventCardProps {
  id: string;
  name: string;
  category?: string;
  date: string; // Expecting a format like "Mon, Apr 14" or similar
  time?: string; // Optional time
  location: string;
  hostName: string | null; // Allow null
  hostImage?: string | null; // Allow null
  backgroundImage?: string | null; // Allow null
  currentRsvp?: 'YES' | 'MAYBE' | 'NO' | null;
  attendeeCount?: number; // Optional attendee count
  // Callbacks should ideally pass eventId and the new status
  onRSVP?: (eventId: string, status: 'YES' | 'MAYBE' | 'NO') => void;
  onAddToCalendar?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  // Add other actions if needed
}

export default function EventCard({
  id,
  name,
  category,
  date,
  time,
  location,
  hostName,
  hostImage,
  backgroundImage,
  currentRsvp,
  attendeeCount,
  onRSVP,
  onAddToCalendar,
  onShare
}: EventCardProps) {
  // Local state to manage RSVP optimistically or if prop isn't controlling it fully
  const [userRsvp, setUserRsvp] = useState<'YES' | 'MAYBE' | 'NO' | null>(currentRsvp ?? null);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update local state if prop changes
  useEffect(() => {
    setUserRsvp(currentRsvp ?? null);
  }, [currentRsvp]);

  // Handle RSVP button click
  const handleRsvp = (status: 'YES' | 'MAYBE' | 'NO') => {
    setUserRsvp(status); // Optimistic update
    if (onRSVP) onRSVP(id, status); // Call prop function
  };

  // Determine button variant based on RSVP status
  const getRsvpButtonVariant = (buttonType: 'YES' | 'MAYBE' | 'NO'): 'default' | 'outline' => {
    return userRsvp === buttonType ? 'default' : 'outline';
  };

  // Define background style with gradient overlay for better text readability
  const backgroundStyle = backgroundImage
    ? { backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(to bottom, var(--primary), var(--primary-foreground))' };

  const MotionButton = motion(Button); // Create motion component for Button

  // Get RSVP status text
  const getRsvpStatusText = () => {
    if (!userRsvp) return null;
    
    return userRsvp === 'YES' 
      ? "You're going!" 
      : userRsvp === 'MAYBE' 
        ? "You might attend" 
        : "You can't attend";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden w-full max-w-md mx-auto shadow-xl border border-border/50 bg-cover bg-center relative"
      style={backgroundStyle}
    >
      {/* Overlay for text contrast */}
      <div className="bg-black/40 backdrop-blur-[2px] p-5 sm:p-6 text-white">
        {/* RSVP Status Badge - Only show if user has RSVP'd */}
        {userRsvp && (
          <div className={cn(
            "absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-medium shadow-md",
            userRsvp === 'YES' ? "bg-green-600 text-white" : 
            userRsvp === 'MAYBE' ? "bg-amber-500 text-white" : 
            "bg-red-600 text-white"
          )}>
            {getRsvpStatusText()}
          </div>
        )}

        {/* Top Section: Host and Category */}
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="flex justify-between items-center mb-4"
        >
          <Link href={`/profile/${hostName}`} className="flex items-center gap-2 group min-w-0">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-white/20 group-hover:border-white transition-colors">
              <AvatarImage src={hostImage ?? undefined} alt={hostName ?? 'Host'} />
              <AvatarFallback className="text-xs bg-black/30">{hostName?.[0] || 'H'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-white/70 text-[11px] sm:text-xs uppercase tracking-wide">Hosted by</div>
              <div className="text-white font-medium text-sm truncate group-hover:underline">{hostName || 'Unknown Host'}</div>
            </div>
          </Link>
          {category && (
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-[10px] sm:text-xs px-1.5 py-0.5 h-auto backdrop-blur-sm shrink-0">
              {category}
            </Badge>
          )}
        </motion.div>

        {/* Event Name */}
        <motion.h2
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="text-2xl sm:text-3xl font-bold mb-4 leading-tight drop-shadow-sm"
        >
          <Link href={`/events/${id}`} className="hover:underline">{name}</Link>
        </motion.h2>

        {/* Event Details: Date, Time, Location */}
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="space-y-3 text-sm sm:text-base text-white/90 mb-5"
        >
          <div className="flex items-center gap-2 group p-2 rounded-lg transition-colors hover:bg-white/10">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <span>{date}{time ? ` at ${time}` : ''}</span>
          </div>
          <div className="flex items-center gap-2 group p-2 rounded-lg transition-colors hover:bg-white/10">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="truncate">{location}</span>
          </div>
          {attendeeCount !== undefined && (
            <div className="flex items-center gap-2 group p-2 rounded-lg transition-colors hover:bg-white/10">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span>{attendeeCount} going</span>
            </div>
          )}
        </motion.div>

        <hr className="border-white/10 my-4" />

        {/* Attendees/RSVP Section */}
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.25 }}
          className="mb-4"
        >
          <h3 className="text-white/70 uppercase tracking-wider text-xs mb-3">Your RSVP</h3>
          <motion.div layout className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2`}>
            <MotionButton
              variant={getRsvpButtonVariant('YES')}
              size="sm"
              className={cn(
                "transition-all duration-300 border shadow-md", 
                userRsvp === 'YES' && "bg-green-600 border-green-600 hover:bg-green-700 text-white font-semibold scale-105 transform", 
                userRsvp !== 'YES' && "border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              )}
              onClick={() => handleRsvp('YES')}
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
            >
              Going
            </MotionButton>
            <MotionButton
              variant={getRsvpButtonVariant('MAYBE')}
              size="sm"
              className={cn(
                "transition-all duration-300 border shadow-md", 
                userRsvp === 'MAYBE' && "bg-amber-500 border-amber-500 hover:bg-amber-600 text-white font-semibold scale-105 transform", 
                userRsvp !== 'MAYBE' && "border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              )}
              onClick={() => handleRsvp('MAYBE')}
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
            >
              Maybe
            </MotionButton>
            <MotionButton
              variant={getRsvpButtonVariant('NO')}
              size="sm"
              className={cn(
                "transition-all duration-300 border shadow-md", 
                userRsvp === 'NO' && "bg-red-600 border-red-600 hover:bg-red-700 text-white font-semibold scale-105 transform", 
                userRsvp !== 'NO' && "border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              )}
              onClick={() => handleRsvp('NO')}
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }}
            >
              Can&apos;t Go
            </MotionButton>
          </motion.div>
        </motion.div>

        {/* Actions Footer */}
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between gap-2 pt-3"
        >
          {/* View Event Button */}
          <MotionButton
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm shadow-md"
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
            asChild
          >
            <Link href={`/events/${id}`}>View Details <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70"/></Link>
          </MotionButton>

          <div className="flex gap-1">
            {/* Add to Calendar Button */}
            {onAddToCalendar && (
              <MotionButton
                variant="ghost"
                size="icon"
                className="text-white/80 hover:bg-white/10 hover:text-white shadow-sm"
                onClick={() => onAddToCalendar(id)}
                aria-label="Add to calendar"
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
              >
                <CalendarIcon className="h-5 w-5" />
              </MotionButton>
            )}
            {/* Share Button */}
            {onShare && (
              <MotionButton
                variant="ghost"
                size="icon"
                className="text-white/80 hover:bg-white/10 hover:text-white shadow-sm"
                onClick={() => onShare(id)}
                aria-label="Share event"
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
              >
                <Share2 className="h-5 w-5" />
              </MotionButton>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
