'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from './ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { UserPlus, Check, Clock, User, Calendar, Loader2 } from 'lucide-react';

export interface UserProfile {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio?: string | null;
  friendStatus?: 'none' | 'pending' | 'friends';
  events?: {
    id: string;
    name: string;
    count?: number;
  }[];
}

interface UserCardProps {
  user: UserProfile;
  onFriendStatusChange?: () => void;
  showActions?: boolean;
  showBio?: boolean;
  showEvents?: boolean;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export function UserCard({
  user,
  onFriendStatusChange,
  showActions = true,
  showBio = true,
  showEvents = true,
  variant = 'default',
  className = '',
}: UserCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState(user.friendStatus || 'none');

  const isCurrentUser = session?.user?.id === user.id;

  const handleAddFriend = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request');
      }

      setFriendStatus('pending');
      addToast({
        title: 'Friend request sent',
        description: `A friend request has been sent to ${user.name || user.username}`,
        variant: 'success',
      });

      if (onFriendStatusChange) {
        onFriendStatusChange();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Different layouts based on variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        <Link href={`/users/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} alt={user.name || user.username} />
            <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name || user.username}</p>
            {user.name && <p className="text-xs text-muted-foreground truncate">@{user.username}</p>}
          </div>
        </Link>
        
        {showActions && !isCurrentUser && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full ${
                    friendStatus === 'pending' ? 'text-amber-500' : 
                    friendStatus === 'friends' ? 'text-green-500' : ''
                  }`}
                  onClick={friendStatus === 'none' ? handleAddFriend : undefined}
                  disabled={friendStatus !== 'none' || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : friendStatus === 'friends' ? (
                    <Check className="h-4 w-4" />
                  ) : friendStatus === 'pending' ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {friendStatus === 'friends'
                  ? 'Already friends'
                  : friendStatus === 'pending'
                  ? 'Friend request pending'
                  : 'Add friend'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex items-start p-4">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={user.image || undefined} alt={user.name || user.username} />
            <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{user.name || user.username}</h3>
            {user.name && <p className="text-sm text-muted-foreground">@{user.username}</p>}
            
            {showBio && user.bio && (
              <p className="text-sm mt-1 line-clamp-1">{user.bio}</p>
            )}
          </div>
          
          {showActions && !isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              className={`ml-2 ${
                friendStatus === 'pending' ? 'text-amber-500 border-amber-200' : 
                friendStatus === 'friends' ? 'text-green-500 border-green-200' : ''
              }`}
              onClick={friendStatus === 'none' ? handleAddFriend : undefined}
              disabled={friendStatus !== 'none' || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : friendStatus === 'friends' ? (
                <Check className="h-4 w-4 mr-1" />
              ) : friendStatus === 'pending' ? (
                <Clock className="h-4 w-4 mr-1" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              {friendStatus === 'friends'
                ? 'Friends'
                : friendStatus === 'pending'
                ? 'Pending'
                : 'Add Friend'}
            </Button>
          )}
        </div>
        
        <Link href={`/users/${user.id}`} className="block p-3 bg-muted/20 text-center text-sm hover:bg-muted transition-colors">
          View Profile
        </Link>
      </Card>
    );
  }

  // Default card layout
  return (
    <Card className={className}>
      <CardHeader className="relative pb-0">
        <Link href={`/users/${user.id}`} className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-2">
            <AvatarImage src={user.image || undefined} alt={user.name || user.username} />
            <AvatarFallback className="text-xl">{user.name?.[0] || user.username[0]}</AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-semibold">{user.name || user.username}</h3>
          {user.name && <p className="text-sm text-muted-foreground">@{user.username}</p>}
        </Link>
      </CardHeader>
      
      <CardContent className="pt-4 px-6">
        {showBio && user.bio && (
          <p className="text-sm text-center line-clamp-3 mb-4">{user.bio}</p>
        )}
        
        {showEvents && user.events && user.events.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Calendar className="h-4 w-4" />
              Upcoming Events
            </h4>
            <ul className="space-y-1">
              {user.events.slice(0, 2).map(event => (
                <li key={event.id} className="text-sm">
                  <Link href={`/events/${event.id}`} className="hover:underline line-clamp-1">
                    {event.name}
                  </Link>
                </li>
              ))}
              {user.events.length > 2 && (
                <li className="text-xs text-muted-foreground">
                  +{user.events.length - 2} more events
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/users/${user.id}`}>
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </Button>
        
        {showActions && !isCurrentUser && (
          <Button
            variant={friendStatus === 'none' ? "default" : "outline"}
            size="sm"
            className={`flex-1 ml-2 ${
              friendStatus === 'pending' ? 'text-amber-500 border-amber-200' : 
              friendStatus === 'friends' ? 'text-green-500 border-green-200' : ''
            }`}
            onClick={friendStatus === 'none' ? handleAddFriend : undefined}
            disabled={friendStatus !== 'none' || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : friendStatus === 'friends' ? (
              <Check className="h-4 w-4 mr-2" />
            ) : friendStatus === 'pending' ? (
              <Clock className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {friendStatus === 'friends'
              ? 'Friends'
              : friendStatus === 'pending'
              ? 'Request Sent'
              : 'Add Friend'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}