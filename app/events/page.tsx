"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/container";
import { Button } from "@/app/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createAuthClient } from "better-auth/react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import MiniCalendar from "@/app/components/mini-calendar";
import { EventsHeader } from "@/app/components/events-header";
import { Card, CardContent } from "@/app/components/ui/card";
import { AddEventModal } from "@/app/components/add-event-modal";

const { useSession } = createAuthClient()

function EventContent() {
  const { data: session, isPending: status } = useSession();
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch calendar events (dummy fetch for loading/error state)
  const fetchCalendarEvents = useCallback(async () => {
    setIsLoadingCalendar(true);
    setCalendarError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // MiniCalendar fetches its own data
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setCalendarError("Failed to load events. Please try again.");
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

  // Fetch events when month changes or refresh key changes
  useEffect(() => {
    if (!status && session) {
      fetchCalendarEvents();
    }
  }, [fetchCalendarEvents, status, refreshKey]);

  // --- Modal Handling Functions ---
  const handleOpenAddEventModal = (date?: Date) => {
    setSelectedDate(date || null);
    setIsAddEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setIsAddEventModalOpen(false);
    setSelectedDate(null);
  };

  const handleEventAdded = () => {
    setRefreshKey(prev => prev + 1);
    handleCloseEventModal();
  };
  // --- End Modal Handling ---

  return (
    <>
      <Card className="overflow-hidden shadow-sm border border-border/40">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Calendar View
              </h3>
            </div>
            {!status && session && (
              <Button 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-500 text-white hover:from-primary/90 hover:to-blue-500/90 shadow-md hover:shadow-lg transition-all h-9 px-4 rounded-full"
                onClick={() => handleOpenAddEventModal()}
              >
                Create Event
              </Button>
            )}
          </div>
          
          {!status && !session ? (
            <Alert className="bg-yellow-50 border border-yellow-200 text-yellow-800">
              <AlertTriangle className="h-5 w-5 !text-yellow-600" />
              <AlertDescription>
                Please sign in to view your personalized calendar.
              </AlertDescription>
            </Alert>
          ) : status === true || isLoadingCalendar ? (
            <div className="flex items-center justify-center h-60 text-muted-foreground">
              <Loader2 className="h-6 w-6 mr-2 animate-spin" />
              Loading your calendar...
            </div>
          ) : calendarError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                {calendarError} 
                <Button 
                  variant="link"
                  className="p-0 h-auto ml-1 text-destructive underline"
                  onClick={fetchCalendarEvents}
                >
                  Try again?
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <MiniCalendar
              onDateSelect={(date) => {
                if (date) {
                  handleOpenAddEventModal(date);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {isAddEventModalOpen && (
        <AddEventModal 
          isOpen={isAddEventModalOpen} 
          onClose={handleCloseEventModal} 
          onEventAdded={handleEventAdded} 
          initialDate={selectedDate || undefined} 
        />
      )}
    </>
  );
}

export default function EventsPage() {
  return (
    <Container className="py-8 md:py-12">
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto space-y-8"
      >
        <EventsHeader />
        <EventContent />
      </motion.div>
    </Container>
  );
}
