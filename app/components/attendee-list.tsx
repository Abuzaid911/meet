'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

interface Attendee {
  id: string;
  rsvp: 'Yes' | 'No' | 'Maybe';
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface AttendeeListProps {
  eventId: string;
  isHost: boolean;
}

export function AttendeeList({ eventId, isHost }: AttendeeListProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const fetchAttendees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/attendees`);
      if (!response.ok) throw new Error('Failed to fetch attendees');
      const data = await response.json();
      console.log(data);
      if (Array.isArray(data)) {
        setAttendees(data);
      } else if (Array.isArray(data.attendees)) {
        setAttendees(data.attendees);
      } else {
        throw new Error('Unexpected data format');
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      addToast({
        title: 'Error',
        description: 'Failed to load attendees.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, addToast]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const handleRemoveAttendee = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the event?`)) return;

    try {
      const response = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to remove attendee');

      addToast({
        title: 'Success',
        description: 'Attendee removed successfully',
      });

      // Refresh attendee list
      setAttendees((prev) => prev.filter((attendee) => attendee.user.email !== email));
    } catch (error) {
      console.error('Error removing attendee:', error);
      addToast({
        title: 'Error',
        description: 'Failed to remove attendee',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <p>Loading attendees...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Attendees</h2>
      {Array.isArray(attendees) && attendees.length > 0 ? (
        <ul className="space-y-4">
          {attendees.map((attendee) => (
            <li key={attendee.id} className="border p-4 rounded-lg shadow-md flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={attendee.user.image || undefined} />
                  <AvatarFallback>{attendee.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{attendee.user.name}</p>
                  <p className="text-sm text-gray-600">{attendee.user.email}</p>
                  <p className="text-sm">RSVP: {attendee.rsvp}</p>
                </div>
              </div>
              {isHost && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveAttendee(attendee.user.email)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No attendees yet</p>
      )}
    </div>
  );
}