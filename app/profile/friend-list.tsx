'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
  Users,
  Filter // Added Filter icon
} from 'lucide-react'
import Link from 'next/link'
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
import { Skeleton } from '../components/ui/skeleton' // Import Skeleton

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
  // ... (state variables remain mostly the same) ...
  // Removed showSearch state as search is now static
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOption, setFilterOption] = useState('all')
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null)
  const [isDeletingFriend, setIsDeletingFriend] = useState<string | null>(null)
  const { addToast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null); // Keep ref if needed

  useEffect(() => {
    if (searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, []);

  // Memoize filtered friends to avoid re-calculation on every render
  const filteredFriends = useMemo(() => {
    let filtered = [...friends];

    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(friend =>
        friend.name.toLowerCase().includes(lowercasedSearch) ||
        friend.username.toLowerCase().includes(lowercasedSearch)
      );
    }

    if (filterOption === 'alphabetical') {
      // Create a new sorted array
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Add more filters/sorts here if needed (e.g., by date added requires timestamp)

    return filtered;
  }, [searchTerm, friends, filterOption]);

  // ... (handleAddFriend, handleFriendRequestSent, handleFriendRequestAction, handleDeleteFriend remain the same) ...
  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true);
  };

  const handleFriendRequestSent = () => {
    onAction();
    setIsAddFriendModalOpen(false);
    addToast({
      title: "Friend Request Sent",
      description: "Your friend request has been sent successfully!",
      variant: "success",
    });
  };

  const handleFriendRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    setIsProcessingRequest(requestId);
    try {
      const response = await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to process friend request');
      }

      const data = await response.json();
      addToast({
        title: action === 'accept' ? "Friend Added" : "Request Declined",
        description: data.message,
        variant: "success",
      });
      onAction();
    } catch (error) {
      console.error('Error processing friend request:', error);
      addToast({
        title: "Error",
        description: `Failed to ${action} friend request`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    setIsDeletingFriend(friendId);
    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete friend');
      }

      const data = await response.json();
      addToast({
        title: "Success",
        description: data.message,
        variant: "success",
      });
      onAction();
    } catch (error) {
      console.error('Error deleting friend:', error);
      addToast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    } finally {
      setIsDeletingFriend(null);
    }
  };

    // Simplified Skeleton Loader for list items
    const FriendListItemSkeleton = () => (
      <div className="flex items-center justify-between p-2 rounded-lg">
         <div className="flex items-center space-x-3 flex-grow min-w-0">
           <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
           <div className="space-y-1.5 min-w-0">
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-3 w-16" />
           </div>
         </div>
         <Skeleton className="h-8 w-8 rounded-md" />
       </div>
    );
    
    // Skeleton for pending requests
    const PendingRequestSkeleton = () => (
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
             <Skeleton className="h-4 w-20" />
             <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
           <Skeleton className="h-7 w-7 rounded-md" />
           <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    );

  if (previewMode) {
    // ... (previewMode logic remains the same) ...
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
      <CardHeader className="border-b p-4"> {/* Adjusted padding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"> {/* Increased gap */}
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {/* Display count based on filtered list if search is active, otherwise total */}
            <CardTitle className="text-lg whitespace-nowrap">
              Friends {`(${isLoading ? '...' : (searchTerm ? filteredFriends.length : friends.length)})`}
            </CardTitle>
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            {/* Static Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-sm pl-8 w-full sm:w-36 md:w-48" // Adjusted padding and width
              />
              {searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full" 
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4"/>
                    <span className="sr-only">Clear search</span>
                  </Button>
              )}
            </div>

            {/* Filter Dropdown */}
            <Select value={filterOption} onValueChange={setFilterOption}>
              <SelectTrigger className="h-9 w-auto text-sm focus:ring-0 focus:ring-offset-0 flex-shrink-0 pr-2"> {/* Adjusted padding */}
                <Filter className="h-4 w-4 mr-1.5 sm:mr-1 text-muted-foreground"/> {/* Added Filter Icon */}
                <span className="sm:hidden">Filter</span> {/* Hidden on sm */}
                <span className="hidden sm:inline"><SelectValue placeholder="Filter" /></span> {/* Visible on sm+ */}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Default</SelectItem> {/* Renamed 'All' */}
                <SelectItem value="alphabetical">A-Z</SelectItem> {/* More specific */}
              </SelectContent>
            </Select>

            {/* Add Friend Button */}
            <Button size="sm" onClick={handleAddFriend} className="h-9 whitespace-nowrap flex-shrink-0">
              <UserPlus className="mr-1.5 h-4 w-4" /> Add Friend
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Use min-h to prevent empty space collapse */}
      <CardContent className="p-4 overflow-y-auto flex-grow min-h-[200px]">
        {isLoading ? (
          // Skeleton Loading State
          <div className="space-y-4">
             <Skeleton className="h-5 w-32 mb-2" /> {/* Title skeleton */}
             <PendingRequestSkeleton />
             <PendingRequestSkeleton />
             <div className="pt-4"> {/* Spacer */}
               <FriendListItemSkeleton />
               <FriendListItemSkeleton />
               <FriendListItemSkeleton />
             </div>
          </div>
        ) : (
          <>
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              // Added border-b and more vertical margin for separation
              <div className="mb-5 pb-5 border-b border-border/50">
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
                              title="Decline Request" // More specific title
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Decline</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                              onClick={() => handleFriendRequestAction(request.id, 'accept')}
                              title="Accept Request" // More specific title
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Accept</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List Section */}
            <div className="space-y-2"> {/* Slightly reduced spacing */}
              {filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg group"> {/* Added group for potential group-hover */}
                    <Link href={`/profile/${friend.username}`} className="flex items-center space-x-3 flex-grow min-w-0 mr-2"> {/* Added margin */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={friend.image ?? undefined} alt={friend.name} />
                        <AvatarFallback>{friend.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{friend.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                      </div>
                    </Link>

                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="More options"> {/* Added title */}
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
                <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center"> {/* Increased padding & centering */}
                  {searchTerm ? (
                    <>
                      <Search className="w-10 h-10 mb-3 text-muted-foreground/50" />
                      <span>No friends match your search.</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-10 h-10 mb-3 text-muted-foreground/50" />
                      <span>No friends yet.</span>
                      <Button variant="link" className="mt-1 p-0 h-auto" onClick={handleAddFriend}>
                        Click here to add some!
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onFriendRequestSent={handleFriendRequestSent}
      />
    </Card>
  )
}
