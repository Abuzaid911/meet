"use client";

import { useState, useCallback } from "react";
// import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/container";
import { Button } from "@/app/components/ui/button";
import { Tabs,TabsContent } from "@/app/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircleIcon,
  CalendarIcon,
  ClockIcon,
  ListIcon,
} from "lucide-react";

import { AddEventModal } from "@/app/components/add-event-modal";
import { EventsHeader } from "@/app/components/events-header";
import MiniCalendar from "@/app/components/mini-calendar";
import { EventCarousel } from "@/app/components/event-carousel";

// interface CalendarAppEvent {
//   id: string;
//   name: string;
//   date: string;
//   time: string;
//   location: string;
//   headerImageUrl?: string;
//   headerColor?: string;
//   userRsvp?: 'YES' | 'MAYBE' | 'NO' | null;
//   attendingCount?: number;
// }

// interface CalendarPersonalEvent {
//   id: string;
//   title: string;
//   name?: string;
//   date: string;
//   time?: string;
// }

function EventContent() {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewType, setViewType] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleAddEvent = useCallback((dateOrEvent?: Date | React.MouseEvent) => {
    if (dateOrEvent instanceof Date) setSelectedDate(dateOrEvent);
    setIsAddEventModalOpen(true);
  }, []);

  const handleCloseEventModal = () => {
    setIsAddEventModalOpen(false);
    setSelectedDate(null);
  };

  const handleEventAdded = () => {
    setRefreshKey(prev => prev + 1);
    handleCloseEventModal();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getCurrentMonthDisplay = () => {
    return currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">Upcoming Events</h2>
          <p className="text-sm text-muted-foreground">View and manage your events</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-dashed h-9 gap-2 text-sm w-full sm:w-auto">
                <PlusCircleIcon className="h-4 w-4" />
                Quick Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start gap-2" onClick={() => handleAddEvent()}>
                  <PlusCircleIcon className="h-4 w-4" /> Create New Event
                </Button>
                <Button variant="ghost" className="justify-start gap-2" onClick={() => handleAddEvent(selectedDate || undefined)}>
                  <CalendarIcon className="h-4 w-4" /> Add Event on {selectedDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Button>
                <Button variant="ghost" className="justify-start gap-2" onClick={() => handleAddEvent(new Date())}>
                  <ClockIcon className="h-4 w-4" /> Add Event for Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <ToggleGroup type="single" value={viewType} onValueChange={value => setViewType(value as "calendar" | "list")}
            className="h-9 border rounded-md">
            <ToggleGroupItem value="calendar" className="h-9 w-9 p-0">
              <CalendarIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="h-9 w-9 p-0">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="w-full">
        {viewType === "calendar" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">{getCurrentMonthDisplay()}</h3>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <MiniCalendar onDateSelect={setSelectedDate} />
          </div>
        ) : (
          <EventCarousel key={refreshKey} />
        )}
      </div>

      {isAddEventModalOpen && (
        <AddEventModal isOpen={isAddEventModalOpen} onClose={handleCloseEventModal} onEventAdded={handleEventAdded} initialDate={selectedDate} />
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
          <Tabs defaultValue="calendar" className="w-full">
            <TabsContent value="calendar">
              <EventContent />
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </Container>
  );
}
