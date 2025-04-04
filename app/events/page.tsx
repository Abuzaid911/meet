"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, PlusCircle } from "lucide-react";
import { EventFeed } from "../components/event-feed";
import { AddEventModal } from "../components/add-event-modal";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SearchParamsHandler({ onOpenModal }: { onOpenModal: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("openAddEventModal") === "true") {
      onOpenModal();
    }
  }, [searchParams, onOpenModal]);

  return null;
}

function EventContent() {
  const { data: session } = useSession();
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddEvent = () => setIsAddEventModalOpen(true);
  const handleCloseEventModal = () => setIsAddEventModalOpen(false);

  const handleEventAdded = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddEventModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <Suspense fallback={null}>
        <SearchParamsHandler onOpenModal={handleAddEvent} />
      </Suspense>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold">Events</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {session && (
            <Button
              onClick={handleAddEvent}
              className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setFilter}>
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
          <TabsTrigger 
            value="all" 
            className="rounded-full text-sm px-4 py-1"
          >
            All Events
          </TabsTrigger>
          <TabsTrigger 
            value="thisWeek" 
            className="rounded-full text-sm px-4 py-1"
          >
            This Week
          </TabsTrigger>
          <TabsTrigger 
            value="thisMonth" 
            className="rounded-full text-sm px-4 py-1"
          >
            This Month
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Event Feed */}
      <EventFeed key={refreshKey} searchTerm={searchTerm} filter={filter} />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={handleCloseEventModal}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
}

export default function EventsPage() {
  return <EventContent />;
}