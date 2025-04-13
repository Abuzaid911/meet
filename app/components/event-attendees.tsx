'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from './ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { UserProfile } from './user-card';
import { Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Dialog, 
  DialogContent
} from './ui/dialog';

interface EventAttendeesProps {
  eventId: string;
  isHost: boolean;
}

type AttendeeWithUser = {
  id: string;
  rsvp: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
  user: {
    id: string;
    name: string | null;
    username: string;
    email: string;
    image: string | null;
  };
};

export function EventAttendees({ eventId, isHost }: EventAttendeesProps) {
  // Remove unused session variable
  // const { data: session } = useSession();
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'friends'>>({});
  const { addToast } = useToast();
  const [selectedUser, setSelectedUser] = useState<AttendeeWithUser | null>(null);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  // Animation classes
  const avatarClasses = "transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-offset-2 hover:ring-primary/70";

  // Fetch attendees
  const fetchAttendees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/attendees`);
      if (!response.ok) throw new Error('Failed to fetch attendees');
      
      const data = await response.json();
      const attendeesList = Array.isArray(data.attendees) 
        ? data.attendees 
        : Array.isArray(data) 
          ? data 
          : [];
      
      setAttendees(attendeesList);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load attendees',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, addToast]);

  // Fetch friend statuses
  const fetchFriendStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/friends');
      if (!response.ok) throw new Error('Failed to fetch friends');
      
      const data = await response.json();
      
      // Create a map of user IDs to friend status
      const statusMap: Record<string, 'none' | 'pending' | 'friends'> = {};
      
      // Mark friends
      (data.friends || []).forEach((friend: {id: string}) => {
        statusMap[friend.id] = 'friends';
      });
      
      // Mark pending requests (both sent and received)
      (data.pendingRequests || []).forEach((request: {senderId: string, receiverId: string}) => {
        if (!statusMap[request.senderId]) {
          statusMap[request.senderId] = 'pending';
        }
        if (!statusMap[request.receiverId]) {
          statusMap[request.receiverId] = 'pending';
        }
      });
      
      setFriendStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching friend statuses:', error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchAttendees();
    fetchFriendStatuses();
  }, [fetchAttendees, fetchFriendStatuses]);

  // This function can be used when friend status changes
  // Removing unused function to fix ESLint error
  // const handleFriendStatusChange = useCallback(() => {
  //   fetchFriendStatuses();
  // }, [fetchFriendStatuses]);

  const handleAvatarClick = (attendee: AttendeeWithUser) => {
    setSelectedUser(attendee);
    setIsPhotoOpen(true);
  };

  // Convert attendees to UserProfile format for UserList
  const mapAttendees = useCallback((rsvpFilter?: string): UserProfile[] => {
    return attendees
      .filter(a => !rsvpFilter || a.rsvp === rsvpFilter)
      .map(attendee => ({
        id: attendee.user.id,
        name: attendee.user.name,
        username: attendee.user.username || attendee.user.email.split('@')[0],
        image: attendee.user.image,
        friendStatus: friendStatuses[attendee.user.id] || 'none',
      }));
  }, [attendees, friendStatuses]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const goingUsers = mapAttendees('YES');
  const maybeUsers = mapAttendees('MAYBE');
  const notGoingUsers = mapAttendees('NO');
  const pendingUsers = mapAttendees('PENDING');

  const filterAttendees = (rsvpStatus: string) => {
    return attendees.filter(a => a.rsvp === rsvpStatus);
  };

  // Avatar grid renderer
  const renderAvatarGrid = (filteredAttendees: AttendeeWithUser[]) => {
    if (filteredAttendees.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No attendees in this category yet.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {filteredAttendees.map((attendee) => (
          <div key={attendee.id} className="flex flex-col items-center group">
            <Avatar 
              className={`h-16 w-16 cursor-pointer ${avatarClasses}`}
              onClick={() => handleAvatarClick(attendee)}
            >
              <AvatarImage src={attendee.user.image || undefined} alt={attendee.user.name || attendee.user.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary">
                {(attendee.user.name?.[0] || attendee.user.username[0])?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 text-sm font-medium text-center truncate w-full">
              {attendee.user.name || attendee.user.username}
            </p>
            <p className="text-xs text-muted-foreground truncate w-full text-center">
              @{attendee.user.username}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="going" className="w-full">
        <TabsList className="w-full mb-6 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="going" className="flex-1 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Going ({goingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="maybe" className="flex-1 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Maybe ({maybeUsers.length})
          </TabsTrigger>
          {isHost && (
            <TabsTrigger value="invited" className="flex-1 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Invited ({pendingUsers.length})
            </TabsTrigger>
          )}
          {isHost && (
            <TabsTrigger value="declined" className="flex-1 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Declined ({notGoingUsers.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="going" className="focus-visible:outline-none focus-visible:ring-0">
          {renderAvatarGrid(filterAttendees('YES'))}
        </TabsContent>

        <TabsContent value="maybe" className="focus-visible:outline-none focus-visible:ring-0">
          {renderAvatarGrid(filterAttendees('MAYBE'))}
        </TabsContent>

        {isHost && (
          <TabsContent value="invited" className="focus-visible:outline-none focus-visible:ring-0">
            {renderAvatarGrid(filterAttendees('PENDING'))}
          </TabsContent>
        )}

        {isHost && (
          <TabsContent value="declined" className="focus-visible:outline-none focus-visible:ring-0">
            {renderAvatarGrid(filterAttendees('NO'))}
          </TabsContent>
        )}
      </Tabs>

      {/* Photo Detail Dialog */}
      <Dialog open={isPhotoOpen} onOpenChange={setIsPhotoOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-lg overflow-hidden">
          <div className="relative">
            {/* Close button */}
            <Button 
              onClick={() => setIsPhotoOpen(false)} 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 rounded-full bg-black/20 hover:bg-black/40 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedUser && (
              <div className="flex flex-col">
                {/* Large avatar */}
                <div className="relative w-full aspect-square bg-muted">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage 
                      src={selectedUser.user.image || undefined} 
                      alt={selectedUser.user.name || selectedUser.user.username} 
                      className="object-cover"
                    />
                    <AvatarFallback className="w-full h-full text-4xl rounded-none bg-gradient-to-br from-primary/80 to-primary">
                      {(selectedUser.user.name?.[0] || selectedUser.user.username[0])?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* User info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    {selectedUser.user.name || selectedUser.user.username}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    @{selectedUser.user.username}
                  </p>
                  
                  <Link href={`/users/${selectedUser.user.id}`}>
                    <Button className="w-full">View Profile</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}