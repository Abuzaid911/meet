"use client"

import { useState } from "react"
import { EventFeed } from "./components/event-feed"
import { AddEventModal } from "./components/add-event-modal"
import { useSession } from "next-auth/react"
import { PlusCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const { data: session } = useSession()
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)

  const handleAddEvent = () => setIsAddEventModalOpen(true)
  const handleCloseEventModal = () => setIsAddEventModalOpen(false)

  const handleEventAdded = () => {
    // Refresh the EventFeed when a new event is added
    // This could be implemented by adding a key to EventFeed and changing it here
    // or by implementing a refresh method in EventFeed
  }

  return (
    <div className="pt-24 space-y-12 px-4 md:px-8 lg:px-16">
      {/* ✅ Header Section */}
      <div className="text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-800">
          Welcome to <span className="text-teal-500">Social Scheduler</span>
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Plan and manage events effortlessly with your friends.
        </p>

        {/* ✅ Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {session && (
            <motion.button
              onClick={handleAddEvent}
              className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Event
            </motion.button>
          )}
        </div>
      </div>

      {/* ✅ Event Feed */}
      <EventFeed />

      {/* ✅ Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={handleCloseEventModal}
        onEventAdded={handleEventAdded}
      />
    </div>
  )
}