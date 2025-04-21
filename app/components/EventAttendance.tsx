"use client";

import React, { useState, useEffect } from "react";
import { createAuthClient } from "better-auth/react"

const {  useSession  } = createAuthClient();
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Check, X, HelpCircle, Loader2, Users } from "lucide-react";

interface EventAttendanceProps {
  eventId: string;
}

interface AttendanceStatus {
  isAttending: boolean;
  rsvp: "YES" | "NO" | "MAYBE" | "PENDING" | null;
  eventName: string;
  isHost: boolean;
  eventDetails: {
    currentAttendees: number;
  };
}

export function EventAttendance({ eventId }: EventAttendanceProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (session?.user?.id) {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/events/${eventId}/rsvp`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch attendance status");
          }
          
          const data: AttendanceStatus = await response.json();
          setAttendance(data);
        } catch (error) {
          console.error("Error fetching attendance:", error);
          addToast({
            title: "Error",
            description: "Failed to load your RSVP status.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchAttendance();
    }
  }, [session, eventId, addToast]);

  const handleRSVP = async (rsvp: "YES" | "NO" | "MAYBE") => {
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rsvp }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update RSVP");
      }
      
      // Get updated RSVP status
      const updatedResponse = await fetch(`/api/events/${eventId}/rsvp`);
      const updatedData = await updatedResponse.json();
      setAttendance(updatedData);
      
      const responseMessages = {
        YES: "You&apos;re attending this event!",
        NO: "You&apos;ve declined this event.",
        MAYBE: "You&apos;ve marked yourself as maybe attending."
      };
      
      addToast({
        title: "RSVP Updated",
        description: responseMessages[rsvp],
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating RSVP:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update RSVP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelRSVP = async () => {
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel RSVP");
      }
      
      // Update local state to reflect cancellation
      setAttendance(prev => 
        prev ? { ...prev, isAttending: false, rsvp: null } : null
      );
      
      addToast({
        title: "RSVP Cancelled",
        description: "Your RSVP has been cancelled.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error cancelling RSVP:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel RSVP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If not signed in, show sign-in prompt
  if (!session) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">RSVP to this event</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Sign in to RSVP to this event.</p>
        <Button 
          onClick={() => router.push('/auth/signin')}
          className="bg-gradient-to-r from-teal-400 to-blue-500 text-white"
        >
          Sign In
        </Button>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading RSVP status...</span>
      </div>
    );
  }
  
  // Event host view (simplified)
  if (attendance?.isHost) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">You&apos;re the host</h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Users className="mr-1 h-4 w-4" />
            <span>{attendance.eventDetails.currentAttendees} attending</span>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          As the host, you&apos;re automatically attending this event.
        </p>
      </div>
    );
  }
  
  // Attendee view
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">RSVP to this event</h3>
      
      {/* Current RSVP status */}
      {attendance?.rsvp && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium">
            Your current status: 
            <span className={`ml-2 ${
              attendance.rsvp === 'YES' ? 'text-green-600 dark:text-green-400' :
              attendance.rsvp === 'NO' ? 'text-red-600 dark:text-red-400' :
              attendance.rsvp === 'MAYBE' ? 'text-amber-600 dark:text-amber-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {attendance.rsvp === 'YES' ? 'Going' :
               attendance.rsvp === 'NO' ? 'Not Going' :
               attendance.rsvp === 'MAYBE' ? 'Maybe' :
               attendance.rsvp === 'PENDING' ? 'Invited' : 'Unknown'}
            </span>
          </p>
        </div>
      )}
      
      {/* RSVP Buttons */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <Button
          onClick={() => handleRSVP("YES")}
          disabled={isSubmitting || attendance?.rsvp === "YES"}
          variant={attendance?.rsvp === "YES" ? "default" : "outline"}
          className={attendance?.rsvp === "YES" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isSubmitting && attendance?.rsvp !== "YES" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Going
        </Button>
        
        <Button
          onClick={() => handleRSVP("MAYBE")}
          disabled={isSubmitting || attendance?.rsvp === "MAYBE"}
          variant={attendance?.rsvp === "MAYBE" ? "default" : "outline"}
          className={attendance?.rsvp === "MAYBE" ? "bg-amber-600 hover:bg-amber-700" : ""}
        >
          {isSubmitting && attendance?.rsvp !== "MAYBE" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <HelpCircle className="mr-2 h-4 w-4" />
          )}
          Maybe
        </Button>
        
        <Button
          onClick={() => handleRSVP("NO")}
          disabled={isSubmitting || attendance?.rsvp === "NO"}
          variant={attendance?.rsvp === "NO" ? "default" : "outline"}
          className={attendance?.rsvp === "NO" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {isSubmitting && attendance?.rsvp !== "NO" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Can&apos;t Go
        </Button>
      </div>
      
      {/* Cancel RSVP option */}
      {attendance?.isAttending && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleCancelRSVP}
            disabled={isSubmitting}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 p-0"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Cancel my RSVP
          </Button>
        </div>
      )}
    </div>
  );
}