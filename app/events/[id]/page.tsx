'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '../../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Textarea } from '../../components/ui/textarea'
import { CommentList } from '../../components/comment-list'
import { useToast } from '../../components/ui/use-toast'
import { EditEventModal } from '../../components/edit-event-modal'
import { AddAttendeeModal } from '../../components/add-attendee-modal'
// import { 
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "../../components/ui/alert-dialog"
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon, Edit2Icon, TrashIcon, PlusCircleIcon } from 'lucide-react'

interface Attendee {
  id: string
  name: string
  image: string | null
  rsvp: 'Yes' | 'No' | 'Maybe'
}

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
  host: {
    id: string
    name: string
    image: string | null
  }
  attendees: Attendee[]
}

export default function EventPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddAttendeeModalOpen, setIsAddAttendeeModalOpen] = useState(false)
  const { data: session } = useSession()
  const { addToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
      // addToast({
      //   title: 'Error',
      //   description: 'Failed to load event',
      //   variant: 'destructive',
      // })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/events/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      })
      if (!response.ok) {
        throw new Error('Failed to submit comment')
      }
      setComment('')
      fetchEvent() // Refresh event data to include new comment
      addToast({
        title: 'Success',
        description: 'Comment added successfully',
      })
    } catch (error) {
      console.error('Error submitting comment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      })
    }
  }

  const handleRSVP = async (rsvp: 'Yes' | 'No' | 'Maybe') => {
    if (!session) {
      addToast({
        title: 'Error',
        description: 'Please sign in to RSVP',
        variant: 'destructive',
      })
      return
    }
    try {
      const response = await fetch(`/api/events/${id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp }),
      })
      if (!response.ok) {
        throw new Error('Failed to update RSVP')
      }
      fetchEvent() // Refresh event data
      addToast({
        title: 'Success',
        description: `Successfully RSVP'd as ${rsvp}`,
      })
    } catch (error) {
      console.error('Error updating RSVP:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update RSVP',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete event')
      }
      addToast({
        title: 'Success',
        description: 'Event deleted successfully',
      })
      router.push('/') // Redirect to home page after deletion
    } catch (error) {
      console.error('Error deleting event:', error)
      addToast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div>Loading event...</div>
  }

  if (!event) {
    return <div>Event not found</div>
  }

  const isHost = event.host.id === session?.user.id
  const userRSVP = event.attendees.find(attendee => attendee.id === session?.user.id)?.rsvp

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <h2 className="text-3xl font-bold">{event.name}</h2>
        {isHost && (
          <div className="space-x-2">
            <Button onClick={() => setIsEditModalOpen(true)} variant="outline">
              <Edit2Icon className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={() => setIsDeleteDialogOpen(true)} variant="destructive">
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-muted-foreground" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
          <p>{event.description}</p>
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2" />
              Attendees
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                  <Avatar>
                    <AvatarImage src={attendee.image || undefined} alt={attendee.name} />
                    <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>{attendee.name}</span>
                  <span className="text-sm text-muted-foreground">({attendee.rsvp})</span>
                </div>
              ))}
            </div>
          </div>
          {!isHost && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">RSVP</h3>
              <div className="space-x-2">
                <Button onClick={() => handleRSVP('Yes')} variant={userRSVP === 'Yes' ? 'default' : 'outline'}>Yes</Button>
                <Button onClick={() => handleRSVP('Maybe')} variant={userRSVP === 'Maybe' ? 'default' : 'outline'}>Maybe</Button>
                <Button onClick={() => handleRSVP('No')} variant={userRSVP === 'No' ? 'default' : 'outline'}>No</Button>
              </div>
            </div>
          )}
          <Button onClick={() => setIsAddAttendeeModalOpen(true)}>
            <PlusCircleIcon className="w-4 h-4 mr-2" />
            Add Attendee
          </Button>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Comments</h3>
          <form onSubmit={handleCommentSubmit} className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit">Post Comment</Button>
          </form>
          <CommentList eventId={id as string} />
        </div>
      </div>
      {isHost && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={event}
          onEventUpdated={fetchEvent}
        />
      )}
      {/* <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
      <AddAttendeeModal
        isOpen={isAddAttendeeModalOpen}
        onClose={() => setIsAddAttendeeModalOpen(false)}
        eventId={id as string}
        onAttendeeAdded={fetchEvent}
      />
    </div>
  )
}
