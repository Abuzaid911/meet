'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
// Removing unused imports
// import { Input } from './ui/input';
// import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Loader2, Search, Check, CircleCheck } from 'lucide-react';

interface AddAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onAttendeeAdded: () => void;
}

interface UserSuggestion {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

export function AddAttendeeModal({ isOpen, onClose, eventId, onAttendeeAdded }: AddAttendeeModalProps) {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data.users);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setSelectedUser(null);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: UserSuggestion) => {
    setUsername(suggestion.username);
    setSelectedUser(suggestion);
    setSuggestions([]);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      addToast({ 
        title: "Missing username", 
        description: "Please enter a username to invite", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser?.username || username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite user');
      }

      addToast({ 
        title: 'Invitation sent!', 
        description: `${selectedUser?.name || username} has been invited to the event.`,
        variant: 'success'
      });
      onAttendeeAdded();
      onClose();
    } catch (error) {
      console.error('Error inviting user:', error);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Invite to Event</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search for people to invite to your event
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Search by username..."
                value={username}
                onValueChange={handleUsernameChange}
                disabled={isSubmitting}
              />
              
              <CommandList>
                {isLoadingSuggestions && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
                  </div>
                )}
                
                {!isLoadingSuggestions && (
                  <CommandEmpty className="py-6 text-center text-sm">
                    {username.length > 0 ? (
                      <div className="flex flex-col items-center space-y-1">
                        <Search className="h-5 w-5 text-muted-foreground mb-1" />
                        <p>No users found with that username</p>
                      </div>
                    ) : (
                      <p>Start typing to search for users</p>
                    )}
                  </CommandEmpty>
                )}
                
                {suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        value={suggestion.username}
                        onSelect={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-2 px-4 py-3 cursor-pointer"
                      >
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage 
                            src={suggestion.image || undefined} 
                            alt={suggestion.name || suggestion.username} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white">
                            {(suggestion.name?.[0] || suggestion.username[0])?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <p className="truncate font-medium">
                            {suggestion.name || suggestion.username}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{suggestion.username}
                          </p>
                        </div>
                        
                        {selectedUser?.id === suggestion.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>

          {selectedUser && (
            <div className="rounded-lg border p-4 flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={selectedUser.image || undefined} 
                  alt={selectedUser.name || selectedUser.username} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white">
                  {(selectedUser.name?.[0] || selectedUser.username[0])?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.name || selectedUser.username}</p>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <CircleCheck className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInvite}
            disabled={isSubmitting || (!username.trim())}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              'Send Invite'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}