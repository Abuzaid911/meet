"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "../../components/ui/button"
import { useToast } from "../../components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
  hostId: string
}

export default function EventPage({ params }: { params:  Promise<{ id: string }> }) {
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/events/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch event")
        }
        const data = await response.json()
        setEvent(data)
      } catch (error) {
        console.error("Error fetching event:", error)
        addToast({
          title: "Error",
          description: "Failed to load event",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [params, addToast])

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { id } = await params;
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      addToast({
        title: "Success",
        description: "Event deleted successfully",
      });
      router.push("/");
    } catch (error) {
      console.error("Error deleting event:", error);
      addToast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!event) {
    return <div className="flex justify-center items-center h-screen">Event not found</div>
  }

  const isHost = session?.user?.id === event.hostId

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
      <p className="text-gray-600 mb-2">Date: {new Date(event.date).toLocaleDateString()}</p>
      <p className="text-gray-600 mb-2">Time: {event.time}</p>
      <p className="text-gray-600 mb-2">Location: {event.location}</p>
      <p className="text-gray-800 mt-4">{event.description}</p>

      {isHost && (
        <div className="mt-8">
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete Event
          </Button>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

