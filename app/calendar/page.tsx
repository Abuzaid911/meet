'use client'

import { useState } from 'react'
import { Calendar } from '@/app/components/ui/calendar'
import { Button } from '@/app/components/ui/button'
import { AddEventModal } from '../components/add-event-modal'
import { EventList } from '../components/event-list'

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Calendar</h2>
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="w-full md:w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <Button onClick={() => setIsModalOpen(true)} className="mt-4 w-full">Add Event</Button>
        </div>
        <EventList date={date} />
      </div>
      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

