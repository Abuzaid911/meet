"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog"
import { useToast } from "../components/ui/use-toast"
import { Loader2, Image as ImageIcon, Palette, Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Info, CheckCircle2, Eye, EyeOff, Globe, Lock } from "lucide-react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { ShareEventButton } from "./share-event-button"
import { motion, AnimatePresence } from "framer-motion"
import Map from "./map"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import Image from "next/image"
import { format } from "date-fns"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded: () => void
  initialDate?: Date | null
}

type PrivacyOption = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

interface Friend {
  id: string
  name: string
  image: string | null
  username: string
}

type Step = "basicInfo" | "location" | "customization" | "invitations" | "preview";

// Define step metadata for better organization
const STEPS: Array<{id: Step, label: string, icon: React.ReactNode, description: string}> = [
  { 
    id: "basicInfo", 
    label: "Basics", 
    icon: <Info className="h-4 w-4" />,
    description: "Event name, date and details"
  },
  { 
    id: "location", 
    label: "Location", 
    icon: <MapPin className="h-4 w-4" />,
    description: "Where will it take place?"
  },
  { 
    id: "customization", 
    label: "Style", 
    icon: <Palette className="h-4 w-4" />,
    description: "Make it look great"
  },
  { 
    id: "invitations", 
    label: "Invites", 
    icon: <Users className="h-4 w-4" />,
    description: "Who&apos;s coming?"
  },
  { 
    id: "preview", 
    label: "Preview", 
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Review and create"
  }
];

// Animation variants are defined but not used, removing to fix linter errors

export function AddEventModal({
  isOpen,
  onClose,
  onEventAdded,
  initialDate = null,
}: AddEventModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("basicInfo");
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventEndTime, setEventEndTime] = useState("")
  const [isAllDay, setIsAllDay] = useState(false)
  const [eventLocation, setEventLocation] = useState("")
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [eventDescription, setEventDescription] = useState("")
  const [privacyOption, setPrivacyOption] = useState<PrivacyOption>("PUBLIC")
  const [headerType, setHeaderType] = useState<"color" | "image">("color")
  const [headerColor, setHeaderColor] = useState("#10b981") // Default teal color
  const [headerImage, setHeaderImage] = useState<File | null>(null)
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [eventId, setEventId] = useState<string | null>(null)
  const [isExpandedView, setIsExpandedView] = useState(false)
  
  const { addToast } = useToast()
  const { data: session } = useSession()

  // Track step completion status
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  // Helper function to compare two time strings
  const compareTimeStrings = useCallback((time1: string, time2: string) => {
    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);
    
    if (hour1 !== hour2) return hour1 - hour2;
    return minute1 - minute2;
  }, []);

  // Helper function to calculate duration in minutes between two time strings
  const calculateDuration = useCallback(() => {
    if (!eventTime || !eventEndTime) return 30; // Default duration
    
    const [startHour, startMinute] = eventTime.split(':').map(Number);
    const [endHour, endMinute] = eventEndTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    let duration = endMinutes - startMinutes;
    if (duration <= 0) {
      // Assume end time is on the next day if it's earlier than start time
      duration += 24 * 60;
    }
    
    return duration;
  }, [eventTime, eventEndTime]);
  
  // Enhanced validation with better messages
  const validateCurrentStep = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case "basicInfo":
        if (!eventName.trim()) newErrors.name = "Please give your event a name";
        if (!eventDate) newErrors.date = "When is the event happening?";
        if (!eventTime && !isAllDay) newErrors.time = "What time does it start?";
        if (eventEndTime && eventTime && compareTimeStrings(eventEndTime, eventTime) <= 0) {
          newErrors.endTime = "End time must be after start time";
        }
        break;
      case "location":
        if (!eventLocation.trim()) newErrors.location = "Please specify a location";
        break;
      case "customization":
        if (headerType === "color" && !headerColor) newErrors.headerColor = "Please choose a color";
        if (headerType === "image" && !headerImage) newErrors.headerImage = "Please upload an image";
        break;
      case "invitations":
        if (privacyOption === "PRIVATE" && selectedFriends.length === 0) {
          newErrors.invitations = "Please select at least one person to invite to your private event";
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    currentStep, 
    eventName, 
    eventDate, 
    eventTime, 
    isAllDay, 
    eventEndTime, 
    eventLocation, 
    headerType, 
    headerColor, 
    headerImage, 
    privacyOption, 
    selectedFriends,
    compareTimeStrings
  ]);

  const nextStep = useCallback(() => {
    if (!validateCurrentStep()) return;
    
    const steps: Step[] = ["basicInfo", "location", "customization", "invitations", "preview"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, validateCurrentStep]);

  const prevStep = useCallback(() => {
    const steps: Step[] = ["basicInfo", "location", "customization", "invitations", "preview"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // Helper to clear draft data
  const clearSavedDraft = useCallback(() => {
    localStorage.removeItem('eventDraft');
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep !== "preview") {
      nextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", eventName);
      formData.append("date", eventDate);
      formData.append("time", isAllDay ? "ALL_DAY" : eventTime);
      formData.append("endTime", isAllDay ? "" : eventEndTime);
      formData.append("location", eventLocation);
      formData.append("lat", locationCoords?.lat !== undefined ? locationCoords.lat.toString() : "0");
      formData.append("lng", locationCoords?.lng !== undefined ? locationCoords.lng.toString() : "0");
      formData.append("description", eventDescription);
      formData.append("privacyLevel", privacyOption);
      formData.append("duration", String(calculateDuration()));
      formData.append("headerType", headerType);
      
      if (headerType === "color") {
        formData.append("headerColor", headerColor);
      } else if (headerType === "image" && headerImage) {
        formData.append("headerImage", headerImage);
      }
      
      if (selectedFriends.length > 0) {
        selectedFriends.forEach(friendId => {
          formData.append("inviteFriends[]", friendId);
        });
      }

      const response = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to create event");
      }

      const result = await response.json();
      setEventId(result.id);
      
      // Clear draft after successful creation
      clearSavedDraft();

      // Track event creation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        // @ts-expect-error - Global gtag might not be typed
        window.gtag?.('event', 'create_event', {
          event_category: 'engagement',
          event_label: 'Event created'
        });
      }

      addToast({
        title: "Success",
        description: "Event created successfully!",
        variant: "success",
      });

      onEventAdded();
    } catch (error) {
      console.error("Error creating event:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentStep, 
    nextStep, 
    eventName, 
    eventDate, 
    isAllDay, 
    eventTime, 
    eventEndTime, 
    eventLocation, 
    locationCoords, 
    eventDescription, 
    privacyOption, 
    calculateDuration, 
    headerType, 
    headerColor, 
    headerImage, 
    selectedFriends, 
    clearSavedDraft, 
    addToast, 
    onEventAdded
  ]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Don't proceed if user is typing in an input
      if (document.activeElement instanceof HTMLInputElement || 
          document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === "ArrowRight" && currentStep !== "preview") {
        e.preventDefault();
        if (validateCurrentStep()) nextStep();
      } else if (e.key === "ArrowLeft" && currentStep !== "basicInfo") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Enter" && currentStep === "preview" && !eventId) {
        e.preventDefault();
        handleSubmit();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, eventId, validateCurrentStep, nextStep, prevStep, handleSubmit]);

  // Monitor form completion for each step
  useEffect(() => {
    // Check if current step is complete
    let isComplete = false;
    
    switch(currentStep) {
      case "basicInfo":
        isComplete = Boolean(eventName.trim() && eventDate && (eventTime || isAllDay));
        break;
      case "location":
        isComplete = Boolean(eventLocation.trim());
        break;
      case "customization":
        isComplete = headerType === "color" ? Boolean(headerColor) : Boolean(headerImage);
        break;
      case "invitations":
        isComplete = privacyOption !== "PRIVATE" || selectedFriends.length > 0;
        break;
      case "preview":
        isComplete = true; // Always complete
        break;
    }
    
    // Update completed steps
    if (isComplete) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  }, [currentStep, eventName, eventDate, eventTime, eventEndTime, isAllDay, eventLocation, headerType, headerColor, headerImage, privacyOption, selectedFriends]);

  // Auto-save form data
  useEffect(() => {
    if (isOpen && (eventName || eventDate || eventTime || isAllDay || eventLocation || eventDescription)) {
      const draftData = {
        name: eventName,
        date: eventDate,
        time: eventTime,
        endTime: eventEndTime,
        isAllDay,
        location: eventLocation,
        description: eventDescription,
        privacyOption,
      };
      localStorage.setItem('eventDraft', JSON.stringify(draftData));
    }
  }, [isOpen, eventName, eventDate, eventTime, eventEndTime, isAllDay, eventLocation, eventDescription, privacyOption]);
  
  // Debounced validation for a better UX
  const debouncedValidate = useCallback(() => {
    if (currentStep !== "preview") validateCurrentStep();
  }, [currentStep, validateCurrentStep]);

  useEffect(() => {
    const timer = setTimeout(debouncedValidate, 500);
    return () => clearTimeout(timer);
  }, [debouncedValidate]);
  
  // Enhanced step indicator
  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-4 px-2">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const stepIndex = STEPS.findIndex(s => s.id === currentStep);
          
          return (
            <div key={step.id} className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-medium transition-all 
                      ${isCurrent 
                        ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary" 
                        : isCompleted
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-muted text-muted-foreground"}`}
                      onClick={() => {
                        // Allow jumping to completed steps or next incomplete step
                        if (isCompleted || index === stepIndex + 1) {
                          setCurrentStep(step.id);
                        }
                      }}
                      disabled={!isCompleted && index > stepIndex + 1}
                    >
                      {isCompleted && !isCurrent ? 
                        <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : 
                        <span className="hidden sm:block">{step.icon}</span>
                      }
                      <span className="sm:hidden">{index + 1}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {index < STEPS.length - 1 && (
                <div className={`h-1 w-4 sm:w-8 mx-1 transition-colors ${
                  index < stepIndex || (isCompleted && index === stepIndex)
                    ? "bg-primary" 
                    : "bg-muted"
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Toggle expanded view for the preview mode
  const toggleExpandedView = () => {
    setIsExpandedView(!isExpandedView);
  };

  // Enhanced render content with animations
  const renderStepContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === "basicInfo" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName" className="text-base font-medium flex items-center">
                  Event Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                  placeholder="E.g., Birthday Party, Team Meeting..."
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <motion.p 
                    initial={{opacity: 0, y: -10}} 
                    animate={{opacity: 1, y: 0}}
                    className="text-sm text-red-500 flex items-center"
                  >
                    {errors.name}
                  </motion.p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="text-base font-medium flex items-center">
                    Date <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={errors.date ? "border-red-500" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.date && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} className="text-sm text-red-500">{errors.date}</motion.p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eventTime" className="text-base font-medium flex items-center">
                    Time <span className="text-red-500 ml-1">*</span>
                  </Label>

                  <div className="flex items-center mb-2">
                    <input
                      id="isAllDay"
                      type="checkbox"
                      className="mr-2"
                      checked={isAllDay}
                      onChange={(e) => {
                        setIsAllDay(e.target.checked);
                        if (e.target.checked) {
                          setEventTime("");
                          setEventEndTime("");
                          setErrors(prev => ({ ...prev, time: "", endTime: "" }));
                        }
                      }}
                    />
                    <Label htmlFor="isAllDay" className="text-sm cursor-pointer">All day event</Label>
                  </div>

                  {!isAllDay && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="startTime" className="text-sm font-medium mb-1">Start time</Label>
                        <div className="flex gap-2">
                          <select
                            id="startHour"
                            value={eventTime.split(':')[0] || ''}
                            onChange={(e) => {
                              const hour = e.target.value;
                              const minute = eventTime.split(':')[1] || '00';
                              setEventTime(`${hour}:${minute}`);
                              setErrors(prev => ({ ...prev, time: "" }));
                            }}
                            className={`flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.time ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                          >
                            <option value="">Hour</option>
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span className="flex items-center">:</span>
                          <select
                            id="startMinute"
                            value={eventTime.split(':')[1] || ''}
                            onChange={(e) => {
                              const hour = eventTime.split(':')[0] || '00';
                              const minute = e.target.value;
                              setEventTime(`${hour}:${minute}`);
                              setErrors(prev => ({ ...prev, time: "" }));
                            }}
                            className={`flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.time ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                          >
                            <option value="">Min</option>
                            {['00', '15', '30', '45'].map((minute) => (
                              <option key={minute} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.time && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} className="text-sm text-red-500">{errors.time}</motion.p>}
                      </div>

                      <div>
                        <Label htmlFor="endTime" className="text-sm font-medium mb-1 flex items-center">
                          End time <span className="text-xs text-muted-foreground ml-2">(optional)</span>
                        </Label>
                        <div className="flex gap-2">
                          <select
                            id="endHour"
                            value={eventEndTime.split(':')[0] || ''}
                            onChange={(e) => {
                              const hour = e.target.value;
                              const minute = eventEndTime.split(':')[1] || '00';
                              setEventEndTime(`${hour}:${minute}`);
                              setErrors(prev => ({ ...prev, endTime: "" }));
                            }}
                            className={`flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.endTime ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                          >
                            <option value="">Hour</option>
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span className="flex items-center">:</span>
                          <select
                            id="endMinute"
                            value={eventEndTime.split(':')[1] || ''}
                            onChange={(e) => {
                              const hour = eventEndTime.split(':')[0] || '00';
                              const minute = e.target.value;
                              setEventEndTime(`${hour}:${minute}`);
                              setErrors(prev => ({ ...prev, endTime: "" }));
                            }}
                            className={`flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.endTime ? "border-red-500" : ""}`}
                            disabled={isSubmitting}
                          >
                            <option value="">Min</option>
                            {['00', '15', '30', '45'].map((minute) => (
                              <option key={minute} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.endTime && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} className="text-sm text-red-500">{errors.endTime}</motion.p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventDescription" className="text-base font-medium">
                  Description <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="eventDescription"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Tell people more about your event..."
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Privacy <span className="text-red-500 ml-1">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose who can see and interact with your event
                </p>

                <div className="flex flex-col space-y-4">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPrivacyOption("PUBLIC")}>
                    <div className="mt-0.5">
                      <input
                        type="radio"
                        id="privacy-public"
                        name="privacy"
                        value="PUBLIC"
                        checked={privacyOption === "PUBLIC"}
                        onChange={() => setPrivacyOption("PUBLIC")}
                        className="h-4 w-4 text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacy-public" className="text-sm cursor-pointer">
                        <span className="font-medium flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-green-500" />
                          Public
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Recommended</Badge>
                        </span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Everyone on the app can discover your event. Great for building community and meeting new people. Your event will appear in the explore feed and search results.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPrivacyOption("FRIENDS_ONLY")}>
                    <div className="mt-0.5">
                      <input
                        type="radio"
                        id="privacy-friends"
                        name="privacy"
                        value="FRIENDS_ONLY"
                        checked={privacyOption === "FRIENDS_ONLY"}
                        onChange={() => setPrivacyOption("FRIENDS_ONLY")}
                        className="h-4 w-4 text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacy-friends" className="text-sm cursor-pointer">
                        <span className="font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          Friends Only
                        </span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only your friends can see and join this event.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setPrivacyOption("PRIVATE")}>
                    <div className="mt-0.5">
                      <input
                        type="radio"
                        id="privacy-private"
                        name="privacy"
                        value="PRIVATE"
                        checked={privacyOption === "PRIVATE"}
                        onChange={() => setPrivacyOption("PRIVATE")}
                        className="h-4 w-4 text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacy-private" className="text-sm cursor-pointer">
                        <span className="font-medium flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-red-500" />
                          Private
                        </span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only people you specifically invite can see this event. You will need to select invitees in the next step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        
          {currentStep === "location" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventLocation" className="text-base font-medium flex items-center">
                  Location <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="eventLocation"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className={errors.location ? "border-red-500" : ""}
                  placeholder="E.g., Coffee Shop, Park, Office..."
                  disabled={isSubmitting}
                />
                {errors.location && (
                  <motion.p 
                    initial={{opacity: 0}} 
                    animate={{opacity: 1}} 
                    className="text-sm text-red-500"
                  >
                    {errors.location}
                  </motion.p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Find on Map</Label>
                <div className="h-[250px] sm:h-[300px] rounded-md overflow-hidden border">
                  <Map
                    defaultAddress={eventLocation}
                    onLocationSelect={(location) => {
                      setEventLocation(location.address);
                      setLocationCoords({ lat: location.lat, lng: location.lng });
                    }}
                    height="100%"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Search for a location or click on the map to set a precise location
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventDescription" className="text-base font-medium">
                  Description <span className="text-xs text-muted-foreground ml-2">(optional)</span>
                </Label>
                <Textarea
                  id="eventDescription"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Add any details your guests should know..."
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Privacy</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Choose who can see your event
                </p>
                
                <div className="space-y-2">
                  <div
                    className={`flex items-start p-3 rounded-md cursor-pointer border transition-colors ${
                      privacyOption === "PUBLIC" 
                        ? "bg-primary/10 border-primary/30" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setPrivacyOption("PUBLIC")}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        type="radio"
                        checked={privacyOption === "PUBLIC"}
                        onChange={() => setPrivacyOption("PUBLIC")}
                        className="mr-2"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <label className="font-medium text-sm cursor-pointer">Public</label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Everyone can see this event, even if they&apos;re not invited
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        
          {currentStep === "customization" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center">
                  Header Style <span className="text-red-500 ml-1">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Choose a beautiful header color or image for your event invitation
                </p>
                
                <Tabs defaultValue="color" value={headerType} onValueChange={(v) => setHeaderType(v as "color" | "image")} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="color" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <span>Color</span>
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>Image</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={headerType}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {headerType === "color" ? (
                        <div className="space-y-2">
                          <Label htmlFor="headerColor">Header Color</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="headerColor"
                              type="color"
                              value={headerColor}
                              onChange={(e) => setHeaderColor(e.target.value)}
                              className={`h-10 w-16 p-1 cursor-pointer ${errors.headerColor ? "border-red-500" : ""}`}
                              disabled={isSubmitting}
                            />
                            <div 
                              className="flex-1 h-10 rounded-md border transition-colors"
                              style={{ backgroundColor: headerColor }}
                            />
                          </div>
                          {errors.headerColor && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} className="text-sm text-red-500">{errors.headerColor}</motion.p>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="headerImage">Header Image</Label>
                          <div className="flex flex-col gap-2">
                            <Input
                              id="headerImage"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className={errors.headerImage ? "border-red-500" : ""}
                              disabled={isSubmitting}
                            />
                            <AnimatePresence>
                              {headerImagePreview && (
                                <motion.div 
                                  initial={{opacity: 0, scale: 0.95}} 
                                  animate={{opacity: 1, scale: 1}}
                                  exit={{opacity: 0, scale: 0.9}}
                                  className="relative aspect-video w-full overflow-hidden rounded-md border"
                                >
                                  <Image 
                                    src={headerImagePreview || ""}
                                    alt="Header preview"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 500px"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-90 hover:opacity-100 z-10"
                                    onClick={() => {
                                      setHeaderImage(null);
                                      setHeaderImagePreview(null);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {errors.headerImage && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} className="text-sm text-red-500">{errors.headerImage}</motion.p>}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </div>
            </div>
          )}
        
          {currentStep === "invitations" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center">
                  <span>Invite {privacyOption === "PRIVATE" ? "People" : "Friends"}</span>
                  <span className="text-xs text-muted-foreground ml-2">{privacyOption === "PRIVATE" ? "(required)" : "(optional)"}</span>
                  {isLoadingFriends && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {privacyOption === "PRIVATE" 
                    ? "Select people to invite to your private event. Only they will be able to see it." 
                    : privacyOption === "FRIENDS_ONLY"
                      ? "Your event will be visible to all your friends, but you can also specifically invite some of them."
                      : "Select friends to invite to your public event. Everyone can see it, but your invitees will receive notifications."}
                </p>
                
                {friends.length > 0 ? (
                  <motion.div 
                    initial={{opacity: 0}} 
                    animate={{opacity: 1}} 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"
                  >
                    {friends.map(friend => (
                      <motion.div 
                        key={friend.id}
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                          selectedFriends.includes(friend.id) 
                            ? 'bg-primary/20 dark:bg-primary/30 border border-primary/30' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                        onClick={() => toggleFriendSelection(friend.id)}
                      >
                        <input
                          type="checkbox"
                          id={`friend-${friend.id}`}
                          checked={selectedFriends.includes(friend.id)}
                          onChange={() => {}}
                          className="mr-2"
                          disabled={isSubmitting}
                        />
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={friend.image || undefined} />
                          <AvatarFallback>{friend.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <label htmlFor={`friend-${friend.id}`} className="text-sm cursor-pointer truncate">
                          {friend.name}
                        </label>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <p className="text-sm text-gray-500">
                      {isLoadingFriends 
                        ? "Loading friends..." 
                        : "No friends to invite. Add friends from your profile page."}
                    </p>
                  </div>
                )}
                
                {errors.invitations && (
                  <motion.p 
                    initial={{opacity: 0}} 
                    animate={{opacity: 1}} 
                    className="text-sm text-red-500 mt-2"
                  >
                    {errors.invitations}
                  </motion.p>
                )}
                
                {selectedFriends.length > 0 && (
                  <p className="text-sm text-primary font-medium mt-2">
                    {selectedFriends.length} {selectedFriends.length === 1 ? 'person' : 'people'} selected
                  </p>
                )}
              </div>
            </div>
          )}
        
          {currentStep === "preview" && (
            <div className="space-y-6">
              {!eventId ? (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="overflow-hidden border border-teal-200 dark:border-teal-900 shadow-sm">
                      <div 
                        className={`w-full transition-all ${isExpandedView ? "h-48 sm:h-60" : "h-28 sm:h-32"}`}
                        style={{ 
                          backgroundColor: headerType === "color" ? headerColor : undefined,
                          backgroundImage: headerImagePreview ? `url(${headerImagePreview})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="h-full w-full flex items-end p-3 sm:p-4 bg-gradient-to-b from-black/0 to-black/70">
                          <Badge className="bg-blue-500 text-white">Upcoming</Badge>
                        </div>
                      </div>
                      <CardContent className={`p-3 sm:p-4 transition-all ${isExpandedView ? "p-4 sm:p-6" : ""}`}>
                        <h3 className={`font-bold mb-2 sm:mb-3 transition-all ${isExpandedView ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>
                          {eventName || "Your Event"}
                        </h3>
                        
                        <div className="space-y-2 sm:space-y-3 text-sm">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-teal-500" />
                            <span className="text-xs sm:text-sm">{formattedDate || "Date not set"}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-teal-500" />
                            <span className="text-xs sm:text-sm">
                              {isAllDay 
                                ? "All day" 
                                : eventTime 
                                  ? `${eventTime}${eventEndTime ? ` - ${eventEndTime}` : ""}`
                                  : "Time not set"}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-teal-500" />
                            <span className="text-xs sm:text-sm truncate">{eventLocation || "Location not set"}</span>
                          </div>

                          <div className="flex items-center">
                            {privacyOption === "PUBLIC" && (
                              <>
                                <Globe className="h-4 w-4 mr-2 text-green-500" />
                                <span>Public event - Everyone can see it</span>
                              </>
                            )}
                            {privacyOption === "FRIENDS_ONLY" && (
                              <>
                                <Users className="h-4 w-4 mr-2 text-blue-500" />
                                <span>Friends-only event - Visible to your friend network</span>
                              </>
                            )}
                            {privacyOption === "PRIVATE" && (
                              <>
                                <Lock className="h-4 w-4 mr-2 text-red-500" />
                                <span>Private event - Only visible to {selectedFriends.length} invited {selectedFriends.length === 1 ? 'person' : 'people'}</span>
                              </>
                            )}
                          </div>
                          
                          {selectedFriends.length > 0 && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-teal-500" />
                              <span>{selectedFriends.length} {selectedFriends.length === 1 ? 'person' : 'people'} invited</span>
                            </div>
                          )}
                        </div>
                        
                        {eventDescription && isExpandedView && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{eventDescription}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleExpandedView}
                      className="mb-2"
                    >
                      {isExpandedView ? (
                        <> <EyeOff className="h-4 w-4 mr-2" /> Compact View </>
                      ) : (
                        <> <Eye className="h-4 w-4 mr-2" /> Expanded View </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground">Ready to create your event?</p>
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{opacity: 0, scale: 0.9}}
                  animate={{opacity: 1, scale: 1}}
                  className="text-center space-y-4"
                >
                  <div className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold">Event Created Successfully!</h3>
                  <p className="text-muted-foreground">Your event has been created. Share it with others!</p>
                  
                  <div className="pt-4">
                    {eventId && (
                      <>
                        <ShareEventButton 
                          eventId={eventId} 
                          eventName={eventName} 
                          variant="default"
                          className="w-full mb-4"
                        />
                        
                        <div className="mt-3 mb-5">
                          <p className="text-xs text-muted-foreground mb-1">Event URL</p>
                          <div className="flex items-center">
                            <Input 
                              value={getEventUrl()}
                              readOnly
                              onClick={(e) => e.currentTarget.select()}
                              className="text-xs pr-16"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="absolute right-6"
                              onClick={() => {
                                navigator.clipboard.writeText(getEventUrl());
                                addToast({
                                  title: "Copied",
                                  description: "Event link copied to clipboard",
                                  variant: "default",
                                });
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={handleClose}
                      >
                        Done
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleClose();
                          // Navigate to event page
                          if (eventId) {
                            window.location.href = `/events/${eventId}`;
                          }
                        }}
                      >
                        View Event Page
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // Use initialDate if provided when the component mounts or when initialDate changes
  useEffect(() => {
    if (initialDate && isOpen) {
      const formattedDate = format(initialDate, 'yyyy-MM-dd');
      setEventDate(formattedDate);
    }
  }, [initialDate, isOpen]);

  // Fetch user's friends when modal opens
  useEffect(() => {
    const fetchFriends = async () => {
      if (isOpen && session?.user?.id) {
        setIsLoadingFriends(true)
        try {
          const response = await fetch('/api/friends')
          if (response.ok) {
            const data = await response.json()
            setFriends(data.friends || [])
          }
        } catch (error) {
          console.error('Error fetching friends:', error)
        } finally {
          setIsLoadingFriends(false)
        }
      }
    }
    
    fetchFriends()
  }, [isOpen, session?.user?.id])

  const resetForm = () => {
    setEventName("")
    setEventDate("")
    setEventTime("")
    setEventEndTime("")
    setIsAllDay(false)
    setEventLocation("")
    setLocationCoords(null)
    setEventDescription("")
    setPrivacyOption("PUBLIC")
    setHeaderType("color")
    setHeaderColor("#10b981")
    setHeaderImage(null)
    setHeaderImagePreview(null)
    setSelectedFriends([])
    setErrors({})
    setCurrentStep("basicInfo")
    setEventId(null)
    setCompletedSteps(new Set())
    setIsExpandedView(false)
  }

  const handleClose = () => {
    // If we already created the event or form is pristine, just close
    if (eventId || (!eventName && !eventDate && !eventTime && !eventLocation && !eventDescription)) {
      resetForm();
      onClose();
      return;
    }
    
    // Otherwise ask for confirmation
    if (confirm("Are you sure you want to close? Your progress will be saved as a draft.")) {
      resetForm();
      onClose();
    }
  }

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setHeaderImage(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setHeaderImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setErrors(prev => ({ ...prev, headerImage: "" }))
    } else {
      setHeaderImagePreview(null)
    }
  }

  // Format date for display
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  // Add function to get event URL after creation
  const getEventUrl = () => {
    if (!eventId) return "";
    // Create a full URL based on window location
    const baseUrl = window.location.origin;
    return `${baseUrl}/events/${eventId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            {currentStep === "preview" && eventId 
              ? "Share Your Event" 
              : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "preview" && eventId 
              ? "Your event is ready! Share it with others."
              : renderStepIndicator()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {renderStepContent()}
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2 pt-4 border-t mt-4">
            {(currentStep !== "basicInfo" && !(currentStep === "preview" && eventId)) && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="mb-2 sm:mb-0 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            
            <div className="flex gap-2 w-full sm:w-auto">
              {!(currentStep === "preview" && eventId) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
              )}
              
              {currentStep === "preview" && !eventId ? (
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-500 to-gray-500 text-white hover:from-gray-500 hover:to-blue-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              ) : currentStep !== "preview" && (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}