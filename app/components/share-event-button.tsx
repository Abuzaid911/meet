"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Share, Copy, Check, Link } from "lucide-react";
import { useToast } from "./ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ShareEventButtonProps {
  eventId: string;
  eventName: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareEventButton({
  eventId,
  eventName,
  className,
  variant = "default",
  size = "default",
}: ShareEventButtonProps) {
  const [copying, setCopying] = useState(false);
  const { addToast } = useToast();
  
  // Construct the full URL for sharing
  const getShareUrl = () => {
    // Handle both client and server-side rendering
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';
    
    return `${baseUrl}/events/${eventId}`;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareData = {
      title: eventName,
      text: `Check out this event: ${eventName}`,
      url: shareUrl,
    };

    try {
      // Try using the Web Share API (works on mobile)
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        addToast({
          title: "Shared!",
          description: "Event shared successfully.",
          variant: "success",
        });
        return;
      }

      // Fallback to copying the link to clipboard
      await copyToClipboard(shareUrl);
    } catch (error) {
      console.error("Error sharing event:", error);
      addToast({
        title: "Share Failed",
        description: "Couldn't share the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      addToast({
        title: "Link Copied!",
        description: "Event link copied to clipboard.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      addToast({
        title: "Copy Failed",
        description: "Couldn't copy the link. Try again or share manually.",
        variant: "destructive",
      });
    } finally {
      setCopying(true);
      // Reset the copying state after a delay
      setTimeout(() => setCopying(false), 2000);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleShare}
            variant={variant}
            size={size}
            className={className}
          >
            {copying ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Share className="mr-2 h-4 w-4" />
                Share Event
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share this event</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}