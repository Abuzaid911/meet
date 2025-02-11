'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { AddFriendModal } from '../components/add-friend-modal'
import { useToast } from '../components/ui/use-toast'
import { Trash2, User } from 'lucide-react'
import Link from 'next/link'

interface Friend {
  id: string
  name: string
  username: string
  email: string
  image: string | null
}

interface FriendRequest {
  id: string
  sender: Friend
}

export function FriendList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const { addToast } = useToast()

  // ✅ Fetch friends & requests with useCallback
  const fetchFriendsAndRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/friends/request')
      if (!response.ok) {
        throw new Error('Failed to fetch friends and requests')
      }
      const data = await response.json()
      setFriends(data.friends || [])
      setPendingRequests(data.pendingRequests || [])
    } catch (error) {
      console.error('Error fetching friends and requests:', error)
      addToast({
        title: "Error",
        description: "Failed to load friends and requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast]) // ✅ Stable dependency

  // ✅ Call fetch function on component mount
  useEffect(() => {
    fetchFriendsAndRequests()
  }, [fetchFriendsAndRequests])

  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true)
  }

  const handleFriendRequestSent = () => {
    fetchFriendsAndRequests()
    setIsAddFriendModalOpen(false)
  }

  const handleFriendRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })

      if (!response.ok) {
        throw new Error('Failed to process friend request')
      }

      const data = await response.json()
      addToast({
        title: "Success",
        description: data.message,
        variant: "success",
      })
      fetchFriendsAndRequests()
    } catch (error) {
      console.error('Error processing friend request:', error)
      addToast({
        title: "Error",
        description: `Failed to ${action} friend request`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteFriend = async (friendId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete friend')
      }

      const data = await response.json()
      addToast({
        title: "Success",
        description: data.message,
        variant: "success",
      })
      fetchFriendsAndRequests()
    } catch (error) {
      console.error('Error deleting friend:', error)
      addToast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading friends and requests...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Friends</h3>
        <Button onClick={handleAddFriend}>Add Friend</Button>
      </div>

      {/* ✅ Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-2">Pending Requests</h4>
          <ul className="space-y-2">
            {pendingRequests.map((request) => (
              <li key={request.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={request.sender.image || undefined} alt={request.sender.name} />
                    <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>{request.sender.username}</span>
                </div>
                <div className="space-x-2">
                  <Button onClick={() => handleFriendRequestAction(request.id, 'accept')} size="sm">
                    Accept
                  </Button>
                  <Button onClick={() => handleFriendRequestAction(request.id, 'decline')} variant="outline" size="sm">
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ Friends List Section */}
      {friends.length === 0 ? (
        <p>You haven&apos;t added any friends yet.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={friend.image || undefined} alt={friend.name} />
                  <AvatarFallback>{friend.name[0]}</AvatarFallback>
                </Avatar>
                <span>{friend.username}</span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/users/${friend.id}`}>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteFriend(friend.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ✅ Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onFriendRequestSent={handleFriendRequestSent}
      />
    </div>
  )
}