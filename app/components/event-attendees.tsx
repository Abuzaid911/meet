'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserList } from './user-list';
import { useToast } from './ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserProfile } from './user-card';
import { Loader2 } from 'lucide-react';

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
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'friends'>>({});
  const { addToast } = useToast();

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

  // Handle friend status change
  const handleFriendStatusChange = useCallback(() => {
    fetchFriendStatuses();
  }, [fetchFriendStatuses]);

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
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const goingUsers = mapAttendees('YES');
  const maybeUsers = mapAttendees('MAYBE');
  const notGoingUsers = mapAttendees('NO');
  const pendingUsers = mapAttendees('PENDING');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="going" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="going" className="flex-1">
            Going ({goingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="maybe" className="flex-1">
            Maybe ({maybeUsers.length})
          </TabsTrigger>
          {isHost && (
            <TabsTrigger value="invited" className="flex-1">
              Invited ({pendingUsers.length})
            </TabsTrigger>
          )}
          {isHost && (
            <TabsTrigger value="declined" className="flex-1">
              Declined ({notGoingUsers.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="going" className="mt-4">
          <UserList
            users={goingUsers}
            title="Going"
            emptyMessage="No one has confirmed attendance yet"
            variant="list"
            cardVariant="inline"
            onFriendStatusChange={handleFriendStatusChange}
          />
        </TabsContent>

        <TabsContent value="maybe" className="mt-4">
          <UserList
            users={maybeUsers}
            title="Maybe Attending"
            emptyMessage="No one has responded 'maybe' yet"
            variant="list"
            cardVariant="inline"
            onFriendStatusChange={handleFriendStatusChange}
          />
        </TabsContent>

        {isHost && (
          <TabsContent value="invited" className="mt-4">
            <UserList
              users={pendingUsers}
              title="Invited"
              emptyMessage="No pending invitations"
              variant="list"
              cardVariant="inline"
              onFriendStatusChange={handleFriendStatusChange}
            />
          </TabsContent>
        )}

        {isHost && (
          <TabsContent value="declined" className="mt-4">
            <UserList
              users={notGoingUsers}
              title="Declined"
              emptyMessage="No one has declined yet"
              variant="list"
              cardVariant="inline"
              onFriendStatusChange={handleFriendStatusChange}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}