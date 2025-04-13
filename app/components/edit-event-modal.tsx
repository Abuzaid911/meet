import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog"
import { useToast } from "./ui/use-toast"
import { Globe, Lock, UserCircle } from "lucide-react"

interface EditEventModalProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onEventUpdated: () => void
}

type PrivacyOption = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export function EditEventModal({ eventId, isOpen, onClose, onEventUpdated }: EditEventModalProps) {
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDuration, setEventDuration] = useState<number | "">("") // ✅ Added event duration
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyOption>("PUBLIC")
  const [originalPrivacyLevel, setOriginalPrivacyLevel] = useState<PrivacyOption>("PUBLIC")
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
        const level = data.privacyLevel || "PUBLIC"
        setPrivacyLevel(level as PrivacyOption)
        setOriginalPrivacyLevel(level as PrivacyOption) // Track original privacy level
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
      // Create a FormData instance for the multipart request
      const formData = new FormData();
      formData.append("name", eventName);
      formData.append("date", eventDate);
      formData.append("time", eventTime);
      formData.append("location", eventLocation);
      formData.append("description", eventDescription || "");
      formData.append("duration", eventDuration.toString());
      formData.append("privacyLevel", privacyLevel);

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        body: formData,
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

      // If privacy level changed, show additional notification
      if (privacyLevel !== originalPrivacyLevel) {
        const privacyChangeMessages = {
          "PUBLIC": "Your event is now public and visible to everyone.",
          "FRIENDS_ONLY": "Your event is now visible only to your friends.",
          "PRIVATE": "Your event is now private and only visible to invited attendees."
        };
        
        addToast({
          title: "Privacy Setting Changed",
          description: privacyChangeMessages[privacyLevel],
          variant: "default",
        })
      }

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update your event details using the form below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateEvent}>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">
                Privacy Setting
              </Label>
              <div className="flex flex-col space-y-3">
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPrivacyLevel("PUBLIC")}>
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      id="privacy-public"
                      name="privacy"
                      value="PUBLIC"
                      checked={privacyLevel === "PUBLIC"}
                      onChange={() => setPrivacyLevel("PUBLIC")}
                      className="h-4 w-4 text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacy-public" className="text-sm cursor-pointer">
                      <span className="font-medium flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-green-500" />
                        Public
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anyone can discover and attend your event
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPrivacyLevel("FRIENDS_ONLY")}>
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      id="privacy-friends"
                      name="privacy"
                      value="FRIENDS_ONLY"
                      checked={privacyLevel === "FRIENDS_ONLY"}
                      onChange={() => setPrivacyLevel("FRIENDS_ONLY")}
                      className="h-4 w-4 text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacy-friends" className="text-sm cursor-pointer">
                      <span className="font-medium flex items-center">
                        <UserCircle className="h-4 w-4 mr-2 text-blue-500" />
                        Friends Only
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only your friends can see and join this event
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPrivacyLevel("PRIVATE")}>
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      id="privacy-private"
                      name="privacy"
                      value="PRIVATE"
                      checked={privacyLevel === "PRIVATE"}
                      onChange={() => setPrivacyLevel("PRIVATE")}
                      className="h-4 w-4 text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacy-private" className="text-sm cursor-pointer">
                      <span className="font-medium flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-red-500" />
                        Private
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only people you invite can see this event
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Warning when downgrading privacy */}
              {originalPrivacyLevel === "PRIVATE" && privacyLevel !== "PRIVATE" && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
                  <strong>Warning:</strong> Changing from private to a more open setting will make your event visible to more people.
                </div>
              )}
              {originalPrivacyLevel === "FRIENDS_ONLY" && privacyLevel === "PUBLIC" && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
                  <strong>Warning:</strong> Changing to public will make your event visible to everyone.
                </div>
              )}
            </div>
            
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