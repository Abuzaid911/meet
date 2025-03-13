'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { AddFriendModal } from '../components/add-friend-modal'
import { useToast } from '../components/ui/use-toast'
import { Trash2, User, PlusCircle, Search, Heart, X, Check, MoreHorizontal, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '../components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

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
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null)
  const [isDeletingFriend, setIsDeletingFriend] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Fetch friends & requests with useCallback
  const fetchFriendsAndRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/request')
      if (!response.ok) {
        throw new Error('Failed to fetch friends and requests')
      }
      const data = await response.json()
      setFriends(data.friends || [])
      setFilteredFriends(data.friends || [])
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
  }, [addToast])

  // Call fetch function on component mount
  useEffect(() => {
    fetchFriendsAndRequests()
  }, [fetchFriendsAndRequests])

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Filter friends based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFriends(friends)
    } else {
      const lowercasedSearch = searchTerm.toLowerCase()
      const filtered = friends.filter(friend => 
        friend.name.toLowerCase().includes(lowercasedSearch) ||
        friend.username.toLowerCase().includes(lowercasedSearch)
      )
      setFilteredFriends(filtered)
    }
  }, [searchTerm, friends])

  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true)
  }

  const handleFriendRequestSent = () => {
    fetchFriendsAndRequests()
    setIsAddFriendModalOpen(false)
    addToast({
      title: "Friend Request Sent",
      description: "Your friend request has been sent successfully!",
      variant: "success",
    })
  }

  const handleFriendRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    setIsProcessingRequest(requestId)
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
        title: action === 'accept' ? "Friend Added" : "Request Declined",
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
    } finally {
      setIsProcessingRequest(null)
    }
  }

  const handleDeleteFriend = async (friendId: string) => {
    setIsDeletingFriend(friendId)
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
    } finally {
      setIsDeletingFriend(null)
    }
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchTerm('')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-500">Loading your friends...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
        <div className="flex items-center gap-2 flex-grow">
          <AnimatePresence>
            {showSearch ? (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center w-full"
              >
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full pr-8"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 rounded-full"
                  onClick={toggleSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-xl font-semibold">Friends</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={toggleSearch}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={handleAddFriend}
                    size="sm"
                    className="rounded-full bg-teal-500 hover:bg-teal-600"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Friend requests section */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-teal-100 dark:border-teal-900 bg-teal-50 dark:bg-teal-900/20 mb-4">
              <CardContent className="p-4">
                <h4 className="text-lg font-semibold mb-2 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-teal-500" />
                  Friend Requests
                  <Badge className="ml-2 bg-teal-500 text-white">{pendingRequests.length}</Badge>
                </h4>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                            <AvatarImage src={request.sender.image || undefined} alt={request.sender.name} />
                            <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.sender.name}</p>
                            <p className="text-sm text-gray-500">@{request.sender.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => handleFriendRequestAction(request.id, 'accept')}
                            disabled={isProcessingRequest === request.id}
                          >
                            {isProcessingRequest === request.id ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Check className="h-4 w-4 text-green-500" />
                            }
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => handleFriendRequestAction(request.id, 'decline')}
                            disabled={isProcessingRequest === request.id}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends list section */}
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Avatar className="h-16 w-16 mb-4 bg-gray-200 dark:bg-gray-700">
            <User className="h-8 w-8 text-gray-400" />
          </Avatar>
          <h3 className="text-lg font-medium mb-2">No friends yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
            You haven&apos;t added any friends yet. Add friends to connect and invite them to events.
          </p>
          <Button 
            onClick={handleAddFriend} 
            className="rounded-full bg-gradient-to-r from-teal-400 to-blue-500 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Friend
          </Button>
        </div>
      ) : (
        <div>
          {/* Search results info */}
          {searchTerm && (
            <p className="text-sm text-gray-500 mb-2">
              {filteredFriends.length === 0 
                ? `No results for "${searchTerm}"` 
                : `Found ${filteredFriends.length} friend${filteredFriends.length !== 1 ? 's' : ''}`}
            </p>
          )}
          
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredFriends.map((friend) => (
              <motion.div 
                key={friend.id} 
                className="py-3 first:pt-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
              >
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/users/${friend.id}`}
                    className="flex items-center space-x-3 flex-1"
                  >
                    <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-700">
                      <AvatarImage src={friend.image || undefined} alt={friend.name} />
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                      >
                        {isDeletingFriend === friend.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/users/${friend.id}`} className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteFriend(friend.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Friend
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onFriendRequestSent={handleFriendRequestSent}
      />
    </div>
  )
}