'use client'

import { useState } from 'react'
import { EventFeed } from './components/event-feed'
import { Button } from './components/ui/button'
import { AddEventModal } from './components/add-event-modal'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { PlusCircle } from 'lucide-react'

export default function Home() {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const { data: session } = useSession()

  const handleAddEvent = () => {
    setIsAddEventModalOpen(true)
  }

  const handleEventAdded = () => {
    // Refresh the EventFeed when a new event is added
    // This could be implemented by adding a key to EventFeed and changing it here
    // or by implementing a refresh method in EventFeed
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Social Scheduler</h1>
        <p className="text-xl mb-4">Schedule meetings and events with your friends</p>
        <div className="space-x-4">
          <Button asChild variant="default">
            <Link href="/calendar">View Calendar</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">My Profile</Link>
          </Button>
          {session && (
            <Button onClick={handleAddEvent} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>
      <EventFeed />
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onEventAdded={handleEventAdded}
      />
    </div>
  )
}

