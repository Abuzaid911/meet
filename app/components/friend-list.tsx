'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { AddFriendModal } from './add-friend-modal'
import { useToast } from '../components/ui/use-toast'
import { Trash2, User, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Friend {
  id: string
  name: string
  email: string
  image: string | null
}

interface FriendRequest {
  id: string
  sender: Friend
}

// Memoized friend list item component to prevent unnecessary re-renders
const FriendListItem = memo(({ 
  friend, 
  onDelete 
}: { 
  friend: Friend
  onDelete: (id: string) => Promise<void> 
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(friend.id)
    setIsDeleting(false)
  }

  return (
    <li className="flex items-center justify-between py-2" key={friend.id}>
      <div className="flex items-center space-x-2">
        <Avatar>
          <AvatarImage 
            src={friend.image || undefined} 
            alt={friend.name} 
          />
          <AvatarFallback>{friend.name[0]}</AvatarFallback>
        </Avatar>
        <span>{friend.email}</span>
      </div>
      <div className="space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          aria-label={`View ${friend.name}'s profile`}
        >
          <Link href={`/users/${friend.id}`}>
            <User className="w-4 h-4 mr-2" />
            View Profile
          </Link>
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove ${friend.name} from friends`}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Delete
        </Button>
      </div>
    </li>
  )
})
FriendListItem.displayName = 'FriendListItem'

export function FriendList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToast } = useToast()

  const fetchFriendsAndRequests = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/friends')
      if (!response.ok) {
        throw new Error('Failed to fetch friends and requests')
      }
      const data = await response.json()
      setFriends(data.friends)
      setPendingRequests(data.pendingRequests)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setError(message)
      addToast('Failed to load friends and requests', 'error')
      console.error('Error fetching friends:', error)
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchFriendsAndRequests()
  }, [fetchFriendsAndRequests])

  const handleFriendRequestAction = useCallback(async (
    requestId: string, 
    action: 'accept' | 'decline'
  ) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend request`)
      }

      await fetchFriendsAndRequests()
      addToast(`Friend request ${action}ed successfully`, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      addToast(message, 'error')
      console.error(`Error ${action}ing friend request:`, error)
    }
  }, [addToast, fetchFriendsAndRequests])

  const handleDeleteFriend = useCallback(async (friendId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove friend')
      }

      setFriends(prev => prev.filter(friend => friend.id !== friendId))
      addToast('Friend removed successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      addToast(message, 'error')
      console.error('Error removing friend:', error)
    }
  }, [addToast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" role="status">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="sr-only">Loading friends...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-4" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Friends</h3>
        <Button onClick={() => setIsModalOpen(true)}>Add Friend</Button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">Pending Requests</h4>
          <ul className="space-y-2" role="list">
            {pendingRequests.map((request) => (
              <li 
                key={request.id} 
                className="flex items-center justify-between bg-muted p-2 rounded"
              >
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage 
                      src={request.sender.image || undefined} 
                      alt={request.sender.name} 
                    />
                    <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>{request.sender.email}</span>
                </div>
                <div className="space-x-2">
                  <Button 
                    onClick={() => handleFriendRequestAction(request.id, 'accept')} 
                    size="sm"
                    aria-label={`Accept friend request from ${request.sender.name}`}
                  >
                    Accept
                  </Button>
                  <Button 
                    onClick={() => handleFriendRequestAction(request.id, 'decline')} 
                    variant="outline" 
                    size="sm"
                    aria-label={`Decline friend request from ${request.sender.name}`}
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {friends.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          You haven't added any friends yet.
        </p>
      ) : (
        <ul className="divide-y" role="list">
          {friends.map((friend) => (
            <FriendListItem
              key={friend.id}
              friend={friend}
              onDelete={handleDeleteFriend}
            />
          ))}
        </ul>
      )}

      <AddFriendModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFriendRequestSent={fetchFriendsAndRequests}
      />
    </div>
  )
}