'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Home, Plus, MessageCircle, User, CalendarX, UserPlus, Share2, Heart } from 'lucide-react';
import { createAuthClient } from "better-auth/react"

const {  useSession  } = createAuthClient();
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

// Define interface for the Event type
interface Event {
    id: string;
    name: string;
    date: string;
    time: string;
    location: string;
    image?: string;
    host: {
        id: string;
        name: string;
        image: string;
    };
}

// Define interface for the Invitation type
interface Invitation {
    id: string;
    eventId: string;
    rsvp: string;
    event: Event;
    createdAt: string;
}

export default function DashboardPage() {
    const { data: session, isPending: status } = useSession();
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch both invitations and upcoming events
    const fetchData = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch pending invitations
            const invitationsResponse = await fetch('/api/user/invitations');
            if (!invitationsResponse.ok) {
                throw new Error('Failed to fetch invitations');
            }
            const invitationsData = await invitationsResponse.json();
            setInvitations(invitationsData);

            // Fetch upcoming events the user is attending
            const eventsResponse = await fetch('/api/events?userId=' + session?.user?.id);
            if (!eventsResponse.ok) {
                throw new Error('Failed to fetch events');
            }
            const eventsData = await eventsResponse.json();
            setUpcomingEvents(eventsData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Unable to load data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (!status && session) {
            fetchData();
        }
    }, [status, fetchData]);

    // RSVP to an invitation
    const handleRSVP = async (invitationId: string, response: 'YES' | 'NO' | 'MAYBE') => {
        try {
            const inviteResponse = await fetch(`/api/events/${invitationId}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ response }),
            });

            if (!inviteResponse.ok) {
                throw new Error('Failed to respond to invitation');
            }

            // Refresh the data
            fetchData();
        } catch (error) {
            console.error('Error responding to invitation:', error);
            setError('Failed to respond to invitation. Please try again.');
        }
    };

    // Loading state
    if (status === true || loading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24">
                <Skeleton className="h-8 w-48 mb-4" />

                <Skeleton className="h-[160px] w-full rounded-xl mb-6" />

                <div className="mb-6">
                    <Skeleton className="h-6 w-32 mb-3" />
                    <div className="flex gap-4 items-center">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="w-full">
                            <Skeleton className="h-5 w-1/3 mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>

                <div>
                    <Skeleton className="h-6 w-36 mb-3" />
                    <div className="flex gap-4 items-center">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="w-full">
                            <Skeleton className="h-5 w-1/3 mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Not authenticated state
    if (!status && !session) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Welcome to MeetOn</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                    You need to sign in to access your dashboard.
                </p>
                <Button asChild className="bg-[#0DCDAA] hover:bg-[#0bc39e]">
                    <Link href="/auth/signin">Sign In</Link>
                </Button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-24">
            {/* Welcome Header */}
            <h1 className="text-2xl font-bold mb-4">Hello {session?.user?.name}</h1>

            {/* Welcome Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Now that you are all set.<br />
                    Let&apos;s make your events extraordinary,<br />
                    starting right here!
                </p>
                <Button asChild className="bg-[#0DCDAA] hover:bg-[#0bc39e] text-white font-semibold px-6 py-3 rounded-xl">
                    <Link href="/events/new">Plan an Event</Link>
                </Button>
            </div>

            {/* Invitations */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Invitations</h2>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4">
                        {error}
                    </div>
                )}

                {invitations.length === 0 ? (
                    <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <UserPlus className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold">No Invitations</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                No invitations received? Take charge and plan your own event with MeetOn. It&apos;s easy and fun!
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
                                <div className="flex-none">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={invitation.event.image || invitation.event.host.image} alt={invitation.event.name} />
                                        <AvatarFallback>{invitation.event.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{invitation.event.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {new Date(invitation.event.date).toLocaleDateString()} at {invitation.event.time}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Hosted by {invitation.event.host.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Button
                                            size="sm"
                                            className="bg-[#0DCDAA] hover:bg-[#0bc39e]"
                                            onClick={() => handleRSVP(invitation.eventId, 'YES')}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRSVP(invitation.eventId, 'MAYBE')}
                                        >
                                            Maybe
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleRSVP(invitation.eventId, 'NO')}
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Upcoming Events */}
            <section>
                <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>

                {upcomingEvents.length === 0 ? (
                    <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <CalendarX className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold">No Events</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your event calendar is a blank canvas. Use MeetOn to paint it with memorable moments.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                            <Link
                                href={`/events/${event.id}`}
                                key={event.id}
                                className="flex gap-4 items-start bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all"
                            >
                                {/* Event Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(event.date).toLocaleDateString()} · {event.time}
                                    </p>
                                    <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate">
                                        {event.name}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {event.location}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Hosted by {event.host.name}</p>
                                    <p className="text-[11px] text-[#0DCDAA] mt-1 font-medium">
                                        {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                                    </p>
                                </div>

                                {/* Action Icons */}
                                <div className="flex flex-col items-end justify-between gap-2 pt-1">
                                    <Heart size={18} className="text-gray-400 hover:text-[#0DCDAA]" />
                                    <Share2 size={18} className="text-gray-400 hover:text-[#0DCDAA]" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-around items-center py-3 shadow-inner">
                <Link href="/dashboard" className="flex flex-col items-center text-[#0DCDAA]">
                    <Home size={24} />
                    <span className="text-xs mt-1">Home</span>
                </Link>
                <Link href="/events" className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <Calendar size={24} />
                    <span className="text-xs mt-1">Events</span>
                </Link>
                <Link href="/events/new" className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <Plus size={24} />
                    <span className="text-xs mt-1">Create</span>
                </Link>
                <Link href="/messages" className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <MessageCircle size={24} />
                    <span className="text-xs mt-1">Messages</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <User size={24} />
                    <span className="text-xs mt-1">Profile</span>
                </Link>
            </nav>
        </main>
    );
}