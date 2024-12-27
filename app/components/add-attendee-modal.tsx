'use client'

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { useToast } from '../components/ui/use-toast'

interface AddAttendeeModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onAttendeeAdded: () => void
}

export function AddAttendeeModal({ isOpen, onClose, eventId, onAttendeeAdded }: AddAttendeeModalProps) {
  const [attendeeEmail, setAttendeeEmail] = useState('')
  const [attendeeRSVP, setAttendeeRSVP] = useState<'Yes' | 'No' | 'Maybe'>('Yes')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: attendeeEmail,
          rsvp: attendeeRSVP,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add attendee')
      }

      addToast({
        title: 'Success',
        description: 'Attendee added successfully!',
      })
      onAttendeeAdded()
      onClose()
    } catch (error) {
      console.error('Error adding attendee:', error)
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add attendee',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Attendee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="attendeeEmail">Attendee Email</Label>
              <Input
                id="attendeeEmail"
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="attendeeRSVP">RSVP</Label>
              <Select onValueChange={(value: 'Yes' | 'No' | 'Maybe') => setAttendeeRSVP(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select RSVP status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Maybe">Maybe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Attendee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

