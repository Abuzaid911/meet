import { useState } from "react"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"

interface EditEventModalProps {
  eventId: string
  onClose: () => void
  onEventUpdated: () => void
}

export function EditEventModal({ eventId, onClose, onEventUpdated }: EditEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { addToast } = useToast()

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
    <div className="modal-content">
      {/* Other modal content */}

      {/* Delete button */}
      <Button variant="destructive" onClick={handleDeleteEvent} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete Event"}
      </Button>
    </div>
  )
}