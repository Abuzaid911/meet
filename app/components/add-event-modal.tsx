"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { useToast } from "../components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded: () => void
  initialDate?: Date
}

export function AddEventModal({ isOpen, onClose, onEventAdded, initialDate }: AddEventModalProps) {
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDuration, setEventDuration] = useState(30)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  useEffect(() => {
    if (initialDate) {
      setEventDate(initialDate.toISOString().split("T")[0])
    }
  }, [initialDate])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!eventName.trim()) newErrors.name = "Event name is required"
    if (!eventDate) newErrors.date = "Date is required"
    if (!eventTime) newErrors.time = "Time is required"
    if (!eventLocation.trim()) newErrors.location = "Location is required"
    if (eventDuration < 1) newErrors.duration = "Duration must be at least 1 minute"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          time: eventTime,
          location: eventLocation,
          description: eventDescription,
          duration: eventDuration,
          
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create event")
      }

      addToast({
        title: "Success",
        description: "Event created successfully!",
        variant: "success",
      })

      onEventAdded()
      onClose()
    } catch (error) {
      console.error("Error creating event:", error)
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">Add New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
              placeholder="Enter event name"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDate">Date</Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={errors.date ? "border-red-500" : ""}
              min={new Date().toISOString().split("T")[0]}
              disabled={isSubmitting}
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventTime">Time</Label>
            <Input
              id="eventTime"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className={errors.time ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventLocation">Location</Label>
            <Input
              id="eventLocation"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className={errors.location ? "border-red-500" : ""}
              placeholder="Enter location"
              disabled={isSubmitting}
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDuration">Duration (minutes)</Label>
            <Input
              id="eventDuration"
              type="number"
              value={eventDuration}
              onChange={(e) => setEventDuration(parseInt(e.target.value))}
              className={errors.duration ? "border-red-500" : ""}
              min="1"
              disabled={isSubmitting}
            />
            {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDescription">Description (optional)</Label>
            <Textarea
              id="eventDescription"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Enter event description"
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}