'use client';

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Calendar,
  Mail,
  User,
  Edit2,
  X,
  Loader2,
  Upload,
  Settings
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  createdAt: string;
}

interface ProfileHeaderCardProps {
  profile: UserProfile;
  isUploadingImage: boolean;
  onEditClick: () => void;
  onImageUploadClick: () => void;
  onImageRemoveClick: () => void;
  isClient: boolean;
}

export function ProfileHeaderCard({
  profile,
  isUploadingImage,
  onEditClick,
  onImageUploadClick,
  onImageRemoveClick,
  isClient
}: ProfileHeaderCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="items-center text-center pt-8 pb-4 bg-gradient-to-b from-muted/50 to-background">
        <Avatar className="w-24 h-24 border-4 border-background shadow-md relative group">
          <AvatarImage src={profile.image ?? undefined} alt={profile.name ?? profile.username ?? 'User'} />
          <AvatarFallback className="text-3xl">
            {profile.name ? profile.name.charAt(0).toUpperCase() : profile.username ? profile.username.charAt(0).toUpperCase() : <User />}
          </AvatarFallback>
          {isUploadingImage && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
              <Loader2 className="text-white h-8 w-8 animate-spin" />
            </div>
          )}
        </Avatar>
        <div className="flex items-center justify-center gap-2 mt-4">
          <CardTitle className="text-2xl font-semibold">{profile.name || "Unnamed User"}</CardTitle>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                ref={triggerRef}
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 settings-dropdown-trigger"
                aria-label="Profile settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              onCloseAutoFocus={(e) => {
                // Prevent the default focus behavior
                e.preventDefault();
                
                // Explicitly move focus back to the trigger button
                if (triggerRef.current) {
                  triggerRef.current.focus();
                }
              }}
              // Use onEscapeKeyDown to ensure focus is managed when using keyboard
              onEscapeKeyDown={() => {
                if (triggerRef.current) {
                  setTimeout(() => {
                    triggerRef.current?.focus();
                  }, 0);
                }
              }}
            >
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEditClick();
                  // Ensure dropdown is closed before focus moves elsewhere
                  setIsDropdownOpen(false);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(event) => {
                  event.preventDefault();
                  if (isClient) onImageUploadClick();
                  // Ensure dropdown is closed before focus moves elsewhere
                  setIsDropdownOpen(false);
                }}
              > 
                <Upload className="mr-2 h-4 w-4" /> 
                <span>Upload Picture</span> 
              </DropdownMenuItem>
              {profile.image && (
                <DropdownMenuItem 
                  onSelect={(event) => {
                    event.preventDefault();
                    if (isClient) onImageRemoveClick();
                    // Ensure dropdown is closed before focus moves elsewhere
                    setIsDropdownOpen(false);
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                > 
                  <X className="mr-2 h-4 w-4" /> 
                  <span>Remove Picture</span> 
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>@{profile.username || "username_missing"}</CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-4 text-sm text-muted-foreground">
        {/* Bio */}
        <p className="text-center mb-4 text-foreground italic">{profile.bio || "No bio yet."}</p>
        <div className="space-y-2">
          {/* Email */}
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            <span>{profile.email || "No email provided"}</span>
          </div>
          {/* Joined date */}
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Joined {format(parseISO(profile.createdAt), 'PPP')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 