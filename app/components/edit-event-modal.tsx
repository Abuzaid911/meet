import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { useToast } from "./ui/use-toast"

interface EditEventModalProps {
  eventId: string
  onClose: () => void
  onEventUpdated: () => void
}

export function EditEventModal({ eventId, onClose, onEventUpdated }: EditEventModalProps) {
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDuration, setEventDuration] = useState<number | "">("") // ✅ Added event duration
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) throw new Error("Failed to fetch event details")
        const data = await response.json()

        setEventName(data.name)
        setEventDate(data.date.split("T")[0])
        setEventTime(data.time)
        setEventLocation(data.location)
        setEventDescription(data.description || "")
        setEventDuration(data.duration || "") // ✅ Load duration
      } catch (error) {
        console.error("Error fetching event details:", error)
        addToast({
          title: "Error",
          description: "Failed to load event details.",
          variant: "destructive",
        })
      }
    }

    fetchEventDetails()
  }, [eventId, addToast])

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          time: eventTime,
          location: eventLocation,
          description: eventDescription,
          duration: eventDuration, // ✅ Updated duration
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update event")
      }

      addToast({
        title: "Success",
        description: "Event updated successfully!",
        variant: "success",
      })

      onEventUpdated()
      onClose()
    } catch (error) {
      console.error("Error updating event:", error)
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete event")

      addToast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "success",
      })

      onEventUpdated()
      onClose()
    } catch (error) {
      console.error("Error deleting event:", error)
      addToast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdateEvent}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name</Label>
              <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="eventDate">Date</Label>
              <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="eventTime">Time</Label>
              <Input id="eventTime" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="eventLocation">Location</Label>
              <Input id="eventLocation" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="eventDuration">Duration (minutes)</Label>
              <Input
                id="eventDuration"
                type="number"
                min="1"
                value={eventDuration}
                onChange={(e) => setEventDuration(e.target.value ? parseInt(e.target.value) : "")}
                required
              />
            </div>
            <div>
              <Label htmlFor="eventDescription">Description</Label>
              <Textarea id="eventDescription" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-between">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Event"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}