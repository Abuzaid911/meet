'use client'

import { useState, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog'
import { useToast } from '../components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onFriendRequestSent: () => void
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddFriendModal({ 
  isOpen, 
  onClose, 
  onFriendRequestSent 
}: AddFriendModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setError('Email is required')
      return false
    }
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email) || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add CSRF token if you have it implemented
        },
        body: JSON.stringify({ friendEmail: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request')
      }

      addToast('Friend request sent successfully!', 'success')
      onFriendRequestSent()
      handleClose()
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to send friend request'
      setError(message)
      addToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = useCallback(() => {
    setEmail('')
    setError('')
    setIsSubmitting(false)
    onClose()
  }, [onClose])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) {
      setError('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent onInteractOutside={(e) => {
        // Prevent closing modal while submitting
        if (isSubmitting) {
          e.preventDefault()
        }
      }}>
        <DialogHeader>
          <DialogTitle>Send Friend Request</DialogTitle>
          <DialogDescription>
            Enter your friend's email address to send them a friend request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friendEmail">
              Friend's Email
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              id="friendEmail"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="friend@example.com"
              required
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'email-error' : undefined}
              disabled={isSubmitting}
              className={error ? 'border-destructive' : ''}
              autoComplete="email"
              autoFocus
            />
            {error && (
              <p 
                id="email-error" 
                className="text-sm text-destructive mt-1"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
              disabled={isSubmitting || !email.trim()}
              aria-label={isSubmitting ? 'Sending request...' : 'Send request'}
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Optional: Add error boundary
AddFriendModal.displayName = 'AddFriendModal'