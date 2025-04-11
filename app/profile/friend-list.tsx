'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { AddFriendModal } from '../components/add-friend-modal'
import { useToast } from '../components/ui/use-toast'
import { 
  Trash2, 
  Search, 
  X, 
  Check, 
  MoreHorizontal, 
  Loader2,
  UserPlus,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '../components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select'

export interface Friend {
  id: string
  name: string
  username: string
  email: string
  image: string | null
}



export interface FriendRequest {
  id: string
  sender: Friend
}

export interface FriendListProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  isLoading: boolean;
  onAction: () => void; // Callback to trigger refetch in parent
  previewMode?: boolean; // Keep preview mode optional
}

export function FriendList({ 
  friends,
  pendingRequests,
  isLoading,
  onAction,
  previewMode = false 
}: FriendListProps) {
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([])
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null)
  const [isDeletingFriend, setIsDeletingFriend] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterOption, setFilterOption] = useState('all')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  useEffect(() => {
    let filtered = [...friends]
    
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(friend => 
        friend.name.toLowerCase().includes(lowercasedSearch) ||
        friend.username.toLowerCase().includes(lowercasedSearch)
      )
    }
    
    if (filterOption === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }
    
    setFilteredFriends(filtered)
  }, [searchTerm, friends, filterOption])

  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true)
  }

  const handleFriendRequestSent = () => {
    onAction()
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
      onAction()
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
      onAction()
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

  if (isLoading && !previewMode) {
    return (
       <Card className="h-full min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    )
  }

  if (previewMode) {
    return (
      <div>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No friends yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.slice(0, 3).map(friend => (
              <Link href={`/profile/${friend.username}`} key={friend.id} className="flex items-center p-2 rounded-lg hover:bg-muted/50">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={friend.image ?? undefined} />
                  <AvatarFallback>{friend.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{friend.name}</p>
                  <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                </div>
              </Link>
            ))}
            {friends.length > 3 && (
              <p className="text-center text-sm text-muted-foreground pt-2">
                +{friends.length - 3} more friends
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
             <CardTitle className="text-lg">Friends {`(${filteredFriends.length})`}</CardTitle>
           </div>

           <div className="flex items-center gap-2 flex-wrap justify-end">
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 text-sm w-full sm:w-40"
                        onBlur={() => { if (!searchTerm) setShowSearch(false); }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showSearch && (
                    <Button variant="ghost" size="icon" onClick={toggleSearch} className="h-9 w-9">
                       <Search className="h-4 w-4" />
                    </Button>
                )}

                <Select value={filterOption} onValueChange={setFilterOption}>
                  <SelectTrigger className="h-9 w-auto text-sm focus:ring-0 focus:ring-offset-0">
                     <span className="sr-only sm:not-sr-only">Filter:</span>
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>

               <Button size="sm" onClick={handleAddFriend} className="h-9 whitespace-nowrap">
                 <UserPlus className="mr-1.5 h-4 w-4" /> Add Friend
               </Button>
             </div>
           </div>
        </CardHeader>

        <CardContent className={`p-4 overflow-y-auto flex-grow`}>
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Pending Requests ({pendingRequests.length})</h3>
              <div className="space-y-3">
                {pendingRequests.map(request => (
                   <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={request.sender.image ?? undefined} alt={request.sender.name} />
                          <AvatarFallback>{request.sender.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none truncate">{request.sender.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{request.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isProcessingRequest === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600"
                              onClick={() => handleFriendRequestAction(request.id, 'decline')}
                              title="Decline"
                            >
                               <X className="h-4 w-4" />
                            </Button>
                             <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                              onClick={() => handleFriendRequestAction(request.id, 'accept')}
                              title="Accept"
                            >
                               <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                 <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                    <Link href={`/profile/${friend.username}`} className="flex items-center space-x-3 flex-grow min-w-0">
                       <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={friend.image ?? undefined} alt={friend.name} />
                        <AvatarFallback>{friend.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{friend.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                      </div>
                    </Link>

                    <div className="flex-shrink-0 ml-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             {isDeletingFriend === friend.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteFriend(friend.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50" disabled={isDeletingFriend === friend.id}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Remove Friend</span>
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                 </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {searchTerm ? 'No friends match your search.' : 'No friends yet. Click "Add Friend" to connect!'}
              </p>
            )}
          </div>
        </CardContent>

        <AddFriendModal
          isOpen={isAddFriendModalOpen}
          onClose={() => setIsAddFriendModalOpen(false)}
          onFriendRequestSent={handleFriendRequestSent}
        />
    </Card>
  )
}