'use client'
import { useState, useEffect, useRef } from 'react'
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
import { useToast } from '../components/ui/use-toast'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onFriendRequestSent: () => void
}

interface UserSuggestion {
  id: string
  username: string
  name: string | null
  image: string | null
  status?: 'none' | 'pending' | 'friends'
}

export function AddFriendModal({ isOpen, onClose, onFriendRequestSent }: AddFriendModalProps) {
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout>()
  const { addToast } = useToast()

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername('')
      setSuggestions([])
      setSelectedUser(null)
      setError(null)
    }
  }, [isOpen])

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      
      const data = await response.json()
      setSuggestions(data.users || [])
      
      if (data.users && data.users.length === 0 && query.length >= 3) {
        setError('No users found matching this username')
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setError('Failed to load user suggestions')
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setSelectedUser(null)
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    
    debounceTimeout.current = setTimeout(() => {
      searchUsers(value)
    }, 300) // 300ms debounce
  }

  const handleSuggestionClick = (suggestion: UserSuggestion) => {
    setUsername(suggestion.username)
    setSelectedUser(suggestion)
    setSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      addToast({
        title: 'Error',
        description: 'Username is required',
        variant: 'destructive',
      })
      return
    }
  
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(),
          // If we have a selectedUser, send the userId directly
          userId: selectedUser?.id
        }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        addToast({
          title: 'Failed to Send Request',
          description: data.error || 'Something went wrong',
          variant: 'destructive',
        })
        return
      }
  
      addToast({
        title: 'Success',
        description: 'Friend request sent successfully!',
        variant: 'success',
      })
  
      // Close the modal and refresh friend list
      setTimeout(() => {
        onFriendRequestSent()
        handleClose()
      }, 500)
    } catch (error) {
      console.error(error)
      setError('Network error. Please check your connection and try again.')
      addToast({
        title: 'Network Error',
        description: 'Please check your internet connection and try again',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setUsername('')
    setSuggestions([])
    setSelectedUser(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-500" />
            Add Friend
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="Search by username or name"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                disabled={isSubmitting}
                className="w-full"
                autoComplete="off"
              />
              
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={suggestion.status === 'pending' || suggestion.status === 'friends'}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={suggestion.image || undefined} />
                        <AvatarFallback>
                          {suggestion.name?.charAt(0) || suggestion.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{suggestion.username}</div>
                        {suggestion.name && (
                          <div className="text-sm text-gray-500 truncate">{suggestion.name}</div>
                        )}
                      </div>
                      
                      {suggestion.status === 'pending' && (
                        <span className="text-xs text-amber-500 whitespace-nowrap">Request pending</span>
                      )}
                      {suggestion.status === 'friends' && (
                        <span className="text-xs text-green-500 whitespace-nowrap">Already friends</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-2">
              Enter a username or name to search for people to add as friends
            </p>
          </div>
          
          {selectedUser && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.image || undefined} />
                <AvatarFallback>
                  {selectedUser.name?.charAt(0) || selectedUser.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedUser.username}</div>
                {selectedUser.name && (
                  <div className="text-sm text-gray-500">{selectedUser.name}</div>
                )}
              </div>
            </div>
          )}
          
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
              disabled={isSubmitting || !username.trim()}
              className={selectedUser ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser ? "Send Friend Request" : "Search"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}