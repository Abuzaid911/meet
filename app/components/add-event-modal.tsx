"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { useToast } from "../components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded: () => void
  initialDate?: Date
}

interface Friend {
  id: string
  name: string
  image: string | null
  username: string
}

export function AddEventModal({ isOpen, onClose, onEventAdded, initialDate }: AddEventModalProps) {
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDuration, setEventDuration] = useState(30)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    if (initialDate) {
      setEventDate(initialDate.toISOString().split("T")[0])
    }
  }, [initialDate])

  // Fetch user's friends when modal opens
  useEffect(() => {
    const fetchFriends = async () => {
      if (isOpen && session?.user?.id) {
        setIsLoadingFriends(true)
        try {
          const response = await fetch('/api/friends')
          if (response.ok) {
            const data = await response.json()
            setFriends(data.friends || [])
          }
        } catch (error) {
          console.error('Error fetching friends:', error)
        } finally {
          setIsLoadingFriends(false)
        }
      }
    }
    
    fetchFriends()
  }, [isOpen, session?.user?.id])

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
      const eventData = {
        name: eventName,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        description: eventDescription,
        duration: eventDuration,
        inviteFriends: selectedFriends.length > 0 ? selectedFriends : undefined
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
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
      resetForm()
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

  const resetForm = () => {
    setEventName("")
    setEventDate("")
    setEventTime("")
    setEventLocation("")
    setEventDescription("")
    setEventDuration(30)
    setSelectedFriends([])
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              rows={3}
            />
          </div>
          
          {/* Friend Invitations Section */}
          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center">
              <span>Invite Friends</span>
              {isLoadingFriends && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </Label>
            
            {friends.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {friends.map(friend => (
                  <div 
                    key={friend.id} 
                    className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                      selectedFriends.includes(friend.id) 
                        ? 'bg-teal-100 dark:bg-teal-900' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => toggleFriendSelection(friend.id)}
                  >
                    <input
                      type="checkbox"
                      id={`friend-${friend.id}`}
                      checked={selectedFriends.includes(friend.id)}
                      onChange={() => {}}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={friend.image || undefined} />
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <label htmlFor={`friend-${friend.id}`} className="text-sm cursor-pointer">
                      {friend.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {isLoadingFriends 
                  ? "Loading friends..." 
                  : "No friends to invite. Add friends from your profile page."}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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