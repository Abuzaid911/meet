'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { AddFriendModal } from '../components/add-friend-modal'
import { useToast } from '../components/ui/use-toast'
import { 
  Trash2, 
  User, 
  Search, 
  Heart, 
  X, 
  Check, 
  MoreHorizontal, 
  Loader2,
  UserPlus,
  Mail,
  Calendar,
  Filter,
  Users
} from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select'

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

interface FriendListProps {
  previewMode?: boolean
}

export function FriendList({ previewMode = false }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null)
  const [isDeletingFriend, setIsDeletingFriend] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterOption, setFilterOption] = useState('all')
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
    let filtered = [...friends]
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(friend => 
        friend.name.toLowerCase().includes(lowercasedSearch) ||
        friend.username.toLowerCase().includes(lowercasedSearch)
      )
    }
    
    // Apply sorting if needed
    if (filterOption === 'recent') {
      // For demonstration we'll just randomize the order
      // In a real app, you'd sort by createdAt or similar field
      filtered = [...filtered].sort(() => Math.random() - 0.5)
    } else if (filterOption === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }
    
    setFilteredFriends(filtered)
  }, [searchTerm, friends, filterOption])

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
  if (isLoading && !previewMode) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-500">Loading your friends...</p>
      </div>
    )
  }

  // If in preview mode, show a simplified version
  if (previewMode) {
    return (
      <div>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No friends yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.slice(0, 3).map(friend => (
              <Link href={`/users/${friend.id}`} key={friend.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={friend.image || undefined} />
                  <AvatarFallback>{friend.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{friend.name}</p>
                  <p className="text-sm text-gray-500 truncate">@{friend.username}</p>
                </div>
              </Link>
            ))}
            {friends.length > 3 && (
              <p className="text-center text-sm text-gray-500 pt-2">
                +{friends.length - 3} more friends
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <AnimatePresence>
            {showSearch ? (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center w-full relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full pl-10 pr-10"
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
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={toggleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                <Select value={filterOption} onValueChange={setFilterOption}>
                  <SelectTrigger className="w-[140px] h-9">
                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Friends</SelectItem>
                    <SelectItem value="alphabetical">Name (A-Z)</SelectItem>
                    <SelectItem value="recent">Recently Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          onClick={handleAddFriend}
          className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Friend
        </Button>
      </div>

      {/* Friend requests section */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-teal-100 dark:border-teal-900/30 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/10 dark:to-blue-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-teal-500" />
                  Friend Requests
                  <Badge className="ml-2 bg-teal-500 text-white">{pendingRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden border bg-white dark:bg-gray-800">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-16 w-16 my-2">
                            <AvatarImage src={request.sender.image || undefined} alt={request.sender.name} />
                            <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="mt-2">
                            <p className="font-medium">{request.sender.name}</p>
                            <p className="text-sm text-gray-500">@{request.sender.username}</p>
                          </div>
                          
                          <div className="flex gap-2 mt-4 w-full">
                            <Button 
                              className="flex-1 bg-teal-500 hover:bg-teal-600"
                              onClick={() => handleFriendRequestAction(request.id, 'accept')}
                              disabled={isProcessingRequest === request.id}
                            >
                              {isProcessingRequest === request.id ? 
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                                <Check className="h-4 w-4 mr-2" />
                              }
                              Accept
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleFriendRequestAction(request.id, 'decline')}
                              disabled={isProcessingRequest === request.id}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends list section */}
      {friends.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No friends yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Connect with others by adding them as friends. You&apos;ll be able to invite them to your events and see their activities.
            </p>
            <Button 
              onClick={handleAddFriend} 
              className="bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Your First Friend
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Search results info */}
          {searchTerm && (
            <p className="text-sm text-gray-500 mb-2">
              {filteredFriends.length === 0 
                ? `No results for "${searchTerm}"` 
                : `Found ${filteredFriends.length} friend${filteredFriends.length !== 1 ? 's' : ''}`}
            </p>
          )}
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFriends.map((friend) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
              >
                <Card className="overflow-hidden h-full hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="border-b p-4 flex items-center">
                      <Link href={`/users/${friend.id}`} className="flex items-center flex-1">
                        <Avatar className="h-14 w-14 mr-4">
                          <AvatarImage src={friend.image || undefined} alt={friend.name} />
                          <AvatarFallback className="text-lg">{friend.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{friend.name}</p>
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
                              <span>View Profile</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Send Message</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/events/new" className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>Invite to Event</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteFriend(friend.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Remove Friend</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 mb-4">
                        <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                        <p className="text-sm truncate">{friend.email}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/users/${friend.id}`}>
                            <User className="mr-2 h-3.5 w-3.5" />
                            Profile
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1 bg-teal-500 hover:bg-teal-600" asChild>
                          <Link href="/events/new">
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            Invite
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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