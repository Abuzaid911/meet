"use client";

import React, { useState, useEffect } from "react";
import { createAuthClient } from "better-auth/react"

const {  useSession  } = createAuthClient();
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { 
  Check, 
  X, 
  HelpCircle, 
  Loader2, 
  Users, 
  Calendar, 
  CalendarCheck, 
  CalendarX, 
  BadgeCheck,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { AnimatePresence, motion } from "framer-motion";

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
  const [activeButton, setActiveButton] = useState<"YES" | "MAYBE" | "NO" | null>(null);

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
          
          if (data.rsvp) {
            setActiveButton(data.rsvp as "YES" | "MAYBE" | "NO");
          }
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
    setActiveButton(rsvp);
    
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
        YES: "You're attending this event!",
        NO: "You've declined this event.",
        MAYBE: "You've marked yourself as maybe attending."
      };
      
      addToast({
        title: "RSVP Updated",
        description: responseMessages[rsvp],
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating RSVP:", error);
      // Reset active button state if there was an error
      if (attendance?.rsvp) {
        setActiveButton(attendance.rsvp as "YES" | "MAYBE" | "NO");
      } else {
        setActiveButton(null);
      }
      
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
      setActiveButton(null);
      
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
      <Card className="overflow-hidden border-border/60">
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4">
          <h3 className="text-lg font-semibold">Join this event</h3>
        </div>
        <CardContent className="p-6">
          <p className="text-muted-foreground mb-6">Sign in to RSVP and connect with other attendees.</p>
          <Button 
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white"
          >
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading RSVP status...</span>
        </CardContent>
      </Card>
    );
  }
  
  // Event host view
  if (attendance?.isHost) {
    return (
      <Card className="border-border/60 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">You&apos;re the Host</h3>
            <Badge variant="default" className="bg-primary">Host</Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span className="text-sm">{attendance.eventDetails.currentAttendees} confirmed attendees</span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" />
              Attending
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            As the host, you&apos;re automatically attending this event. Use the Attendees tab to manage your guest list.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Get the appropriate icon and status color based on RSVP
  const getStatusDetails = () => {
    if (!attendance?.rsvp) return null;
    
    const details = {
      YES: {
        icon: <CalendarCheck className="h-4 w-4" />,
        label: "Going",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-200 dark:border-green-800",
      },
      NO: {
        icon: <CalendarX className="h-4 w-4" />,
        label: "Not Going",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-200 dark:border-red-800",
      },
      MAYBE: {
        icon: <Calendar className="h-4 w-4" />,
        label: "Maybe",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-800",
      },
      PENDING: {
        icon: <HelpCircle className="h-4 w-4" />,
        label: "Invited",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-200 dark:border-blue-800",
      },
    };
    
    return details[attendance.rsvp];
  };
  
  const statusDetails = getStatusDetails();
  
  // Button animations
  const buttonAnimation = {
    tap: { scale: 0.97 },
    hover: { scale: 1.03 }
  };
  
  // Attendee view
  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4">
        <h3 className="text-lg font-semibold">Your Attendance</h3>
      </div>
      <CardContent className="p-6">
        {/* Current RSVP status */}
        {statusDetails && (
          <div className="mb-6">
            <Badge 
              variant="outline" 
              className={`${statusDetails.bg} ${statusDetails.color} ${statusDetails.border} flex items-center gap-1 py-1.5 px-3`}
            >
              {statusDetails.icon}
              <span>{statusDetails.label}</span>
            </Badge>
          </div>
        )}
        
        {/* RSVP Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <motion.div
              whileTap="tap"
              whileHover="hover"
              variants={buttonAnimation}
            >
              <Button
                onClick={() => handleRSVP("YES")}
                disabled={isSubmitting}
                variant="outline"
                className={`w-full border-2 ${activeButton === "YES" 
                  ? "bg-green-500/10 text-green-600 border-green-500/50 shadow-sm" 
                  : "hover:border-green-500/30 hover:text-green-500"}`}
              >
                {isSubmitting && activeButton === "YES" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className={`mr-1 h-4 w-4 ${activeButton === "YES" ? "text-green-600" : ""}`} />
                )}
                Yes
              </Button>
            </motion.div>
            
            <motion.div
              whileTap="tap"
              whileHover="hover"
              variants={buttonAnimation}
            >
              <Button
                onClick={() => handleRSVP("MAYBE")}
                disabled={isSubmitting}
                variant="outline"
                className={`w-full border-2 ${activeButton === "MAYBE" 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/50 shadow-sm" 
                  : "hover:border-amber-500/30 hover:text-amber-500"}`}
              >
                {isSubmitting && activeButton === "MAYBE" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HelpCircle className={`mr-1 h-4 w-4 ${activeButton === "MAYBE" ? "text-amber-600" : ""}`} />
                )}
                Maybe
              </Button>
            </motion.div>
            
            <motion.div
              whileTap="tap"
              whileHover="hover"
              variants={buttonAnimation}
            >
              <Button
                onClick={() => handleRSVP("NO")}
                disabled={isSubmitting}
                variant="outline"
                className={`w-full border-2 ${activeButton === "NO" 
                  ? "bg-red-500/10 text-red-600 border-red-500/50 shadow-sm" 
                  : "hover:border-red-500/30 hover:text-red-500"}`}
              >
                {isSubmitting && activeButton === "NO" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className={`mr-1 h-4 w-4 ${activeButton === "NO" ? "text-red-600" : ""}`} />
                )}
                No
              </Button>
            </motion.div>
          </div>
          
          <AnimatePresence>
            {(attendance?.rsvp === "YES" || attendance?.rsvp === "MAYBE") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/60">
                  <Button
                    onClick={handleCancelRSVP}
                    disabled={isSubmitting}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 px-2 h-8"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Cancel my RSVP
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}