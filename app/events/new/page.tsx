"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "../../components/ui/use-toast";
import { Loader2, ChevronLeft, Calendar, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";

export default function NewEventPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form fields
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date>();

  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!eventTitle) newErrors.eventTitle = "Event title is required";
    if (!description) newErrors.description = "Description is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endTime) newErrors.endTime = "End time is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!location) newErrors.location = "Location is required";
    if (!date) newErrors.date = "Date is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep !== 2) return;
    if (!validateStep2()) return;
    
    setIsSubmitting(true);
    
    try {
      // Format the date and time for the API
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
      
      const eventData = {
        name: eventTitle,
        description,
        date: formattedDate,
        time: startTime,
        endTime: endTime,
        location,
        // You might want to add these if your API requires them
        lat: 0,
        lng: 0,
        duration: calculateDurationInMinutes(startTime, endTime),
      };
      
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create event");
      }
      
      const data = await response.json();
      
      addToast({
        title: "Success",
        description: "Event created successfully!",
        variant: "success",
      });
      
      // Navigate to the event details page
      router.push(`/events/${data.id}`);
      
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
  };

  const calculateDurationInMinutes = (start: string, end: string) => {
    if (!start || !end) return 60; // Default duration
    
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    const startInMinutes = startHours * 60 + startMinutes;
    const endInMinutes = endHours * 60 + endMinutes;
    
    return endInMinutes - startInMinutes;
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-600 mb-4">You need to be logged in to create an event</p>
        <Button onClick={() => router.push("/auth/signin")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative">
          {/* Pink curved border at the top */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-pink-500 rounded-t-2xl"></div>
          
          <div className="pt-8 px-6 pb-6">
            {/* Back Button */}
            <button 
              className="absolute top-6 left-4 text-gray-700 dark:text-gray-300"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            {/* Step Title */}
            <h1 className="text-3xl font-bold mt-6 text-gray-800 dark:text-gray-100">
              {currentStep === 1 ? "Let's start with the basics" : "Where and what does it look like?"}
            </h1>
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {currentStep === 1 ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="eventTitle">Event Title</Label>
                      <Input
                        id="eventTitle"
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="mt-1"
                        placeholder="Enter event title"
                      />
                      {errors.eventTitle && (
                        <p className="text-red-500 text-sm mt-1">{errors.eventTitle}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1"
                        placeholder="Describe your event"
                        rows={3}
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1"
                      />
                      {errors.startTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1"
                      />
                      {errors.endTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image">Event Image</Label>
                      <div className="mt-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center">
                        <div className="w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline"
                          className="mt-2"
                        >
                          Upload Image
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1"
                        placeholder="Enter location"
                      />
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <div className="mt-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-gray-500"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.date && (
                          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-4">
                    <Button 
                      type="submit"
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "Publish Event"
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      onClick={handlePrevStep}
                      variant="outline"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}