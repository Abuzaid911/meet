"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/container";
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import MiniCalendar from "@/app/components/mini-calendar";
import { EventsHeader } from "@/app/components/events-header";

function EventContent() {
  const { status } = useSession();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getCurrentMonthDisplay = () => {
    return currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Fetch calendar events
  const fetchCalendarEvents = useCallback(async () => {
    setIsLoadingCalendar(true);
    setCalendarError(null);
    
    try {
      // Calculate date range (whole month)
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Format dates for API
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      
      // Fetch only events user is invited to or has RSVPed Yes/Maybe to
      const appEventsRes = await fetch(`/api/events/calendar?startDate=${startStr}&endDate=${endStr}&filter=invited-rsvp`);
      
      if (!appEventsRes.ok) {
        throw new Error("Failed to fetch calendar events");
      }
      
      // We fetch the events but don't need to store them since MiniCalendar fetches its own events
      await appEventsRes.json();
      
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setCalendarError("Failed to load events. Please try again.");
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [currentMonth]);

  // Fetch events when month changes
  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents, currentMonth]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">{getCurrentMonthDisplay()}</h3>
        <div className="flex items-center gap-1">
          <Button 
            className="h-8 w-8 bg-gradient-to-r from-primary to-blue-500 text-white hover:from-primary/90 hover:to-blue-500/90 rounded-full p-0"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            className="h-8 w-8 bg-gradient-to-r from-primary to-blue-500 text-white hover:from-primary/90 hover:to-blue-500/90 rounded-full p-0"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {status === "unauthenticated" ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to see your events and invites
          </AlertDescription>
        </Alert>
      ) : isLoadingCalendar ? (
        <div className="p-4 text-center">Loading calendar events...</div>
      ) : calendarError ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{calendarError}</AlertDescription>
        </Alert>
      ) : (
        <MiniCalendar
          onDateSelect={() => {
            // Date selection is handled by the MiniCalendar component
          }}
        />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Container>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto py-8 md:py-12"
      >
        <EventsHeader />
        <div className="mt-8">
          <EventContent />
        </div>
      </motion.div>
    </Container>
  );
}
