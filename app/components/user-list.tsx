'use client';

import { useState } from 'react';
import { UserCard, UserProfile } from './user-card';
import { Input } from './ui/input';
import { Search, Users } from 'lucide-react';

interface UserListProps {
  users: UserProfile[];
  title?: string;
  emptyMessage?: string;
  variant?: 'grid' | 'list';
  showSearch?: boolean;
  cardVariant?: 'default' | 'compact' | 'inline';
  onFriendStatusChange?: () => void;
}

export function UserList({
  users,
  title = 'People',
  emptyMessage = 'No users found',
  variant = 'grid',
  showSearch = true,
  cardVariant = 'default',
  onFriendStatusChange,
}: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
          <span className="text-sm font-normal text-muted-foreground">
            ({users.length})
          </span>
        </h2>
        
        {showSearch && users.length > 5 && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search people..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">{emptyMessage}</p>
      ) : variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              variant={cardVariant}
              onFriendStatusChange={onFriendStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 divide-y">
          {filteredUsers.map((user) => (
            <div key={user.id} className="pt-3 first:pt-0">
              <UserCard
                user={user}
                variant={cardVariant || 'inline'}
                onFriendStatusChange={onFriendStatusChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}