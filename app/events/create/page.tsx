// Enhanced CreateEventPage.tsx with improved UI/UX flow

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ui/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  PartyPopper, 
  Calendar as CalendarIcon, 
  ImagePlus, 
  X as RemoveIcon,
  HelpCircle,
  MapPin,
  Clock,
  Info,
  Check
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";

// --- Zod Schemas ---
const step1Schema = z.object({
  eventName: z.string().min(3, { message: "Event name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageUrl: z.string().url({ message: "Invalid image URL." }).optional().or(z.literal("")),
});

const step2Schema = z.object({
  eventDate: z.date({ required_error: "Please select a date." }),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
});

const step3Schema = z.object({
  location: z.string().min(5, { message: "Location must be at least 5 characters." }),
});

const eventSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type ValidationErrors = {
  eventName?: string[];
  description?: string[];
  imageUrl?: string[];
  eventDate?: string[];
  eventTime?: string[];
  location?: string[];
};

// Step configuration for better organization
const STEPS = [
  { id: 1, title: "Event Details", icon: Info },
  { id: 2, title: "Date & Time", icon: Clock },
  { id: 3, title: "Location", icon: MapPin },
  { id: 4, title: "Review", icon: Check }
];

// Animation variants for step transitions
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

export default function CreateEventPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  // Form state
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0); // For upload progress animation

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = STEPS.length;

  // Auto-focus first field when step changes
  useEffect(() => {
    if (firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 300); // Delay to allow animation to complete
    }
  }, [currentStep]);

  // Debounced validation for better performance
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (formTouched.eventName || formTouched.description) {
        validateStep(1, false);
      }
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [eventName, description, formTouched.eventName, formTouched.description]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (formTouched.eventDate || formTouched.eventTime) {
        validateStep(2, false);
      }
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [eventDate, eventTime, formTouched.eventDate, formTouched.eventTime]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (formTouched.location) {
        validateStep(3, false);
      }
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [location, formTouched.location]);

  const validateStep = (step: number, showToast: boolean = true) => {
    let result;
    let dataToValidate;

    switch (step) {
      case 1:
        dataToValidate = { eventName, description, imageUrl };
        result = step1Schema.safeParse(dataToValidate);
        break;
      case 2:
        dataToValidate = { eventDate, eventTime };
        result = step2Schema.safeParse(dataToValidate);
        break;
      case 3:
        dataToValidate = { location };
        result = step3Schema.safeParse(dataToValidate);
        break;
      default:
        return true;
    }

    if (!result.success) {
      const fieldErrors: ValidationErrors = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof ValidationErrors;
        if (path) {
          fieldErrors[path] = fieldErrors[path] ? [...fieldErrors[path]!, issue.message] : [issue.message];
        }
      });
      
      setErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
      
      if (showToast && Object.keys(fieldErrors).length > 0) {
        addToast({
          title: "Please fix the errors",
          description: "There are some issues that need to be resolved.",
          variant: "destructive",
        });
      }
      
      return false;
    }

    // Clear errors for this step if validation passes
    const newErrors = { ...errors };
    if (step === 1) {
      delete newErrors.eventName;
      delete newErrors.description;
      delete newErrors.imageUrl;
    } else if (step === 2) {
      delete newErrors.eventDate;
      delete newErrors.eventTime;
    } else if (step === 3) {
      delete newErrors.location;
    }
    
    setErrors(newErrors);
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        // Animate progress before changing step
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          progressBar.style.transition = 'width 0.3s ease-in-out';
        }
        
        setCurrentStep(currentStep + 1);
        
        // Show success toast for completing a step
        addToast({
          title: `Step ${currentStep} completed!`,
          description: `Moving to ${STEPS[currentStep].title}`,
          variant: "success",
        });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const jumpToStep = (step: number) => {
    // Only allow jumping to completed steps or the current step
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  // Enhanced image handling with progress animation
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        addToast({
          title: "Invalid File Type",
          description: "Please select an image file (JPEG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "File Too Large",
          description: "Image must be smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageUrl("");
      setErrors(prev => ({ ...prev, imageUrl: undefined }));
      
      // Simulate upload with progress animation
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploadingImage(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app: Upload file to S3/Cloudinary/etc.
      const uploadedUrl = `/images/placeholder-event-${Date.now()}.jpg`;
      
      setImageUrl(uploadedUrl);
      setUploadProgress(100);
      
      addToast({
        title: "Image Uploaded",
        description: "Your image has been successfully uploaded.",
        variant: "success",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      
      addToast({
        title: "Upload Failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive",
      });
      
      setImageFile(null);
      setImagePreview(null);
      setImageUrl("");
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsUploadingImage(false);
      }, 500); // Keep progress bar at 100% briefly before hiding
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    const allData = { eventName, description, imageUrl, eventDate, eventTime, location };
    const validationResult = eventSchema.safeParse(allData);

    if (!validationResult.success) {
      const fieldErrors: ValidationErrors = {};
      validationResult.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof ValidationErrors;
        if (path) {
          fieldErrors[path] = fieldErrors[path] ? [...fieldErrors[path]!, issue.message] : [issue.message];
        }
      });
      
      setErrors(fieldErrors);
      
      // Focus the first step with an error
      if (fieldErrors.eventName || fieldErrors.description) setCurrentStep(1);
      else if (fieldErrors.eventDate || fieldErrors.eventTime) setCurrentStep(2);
      else if (fieldErrors.location) setCurrentStep(3);

      addToast({
        title: "Incomplete Form",
        description: "Please review the highlighted errors.",
        variant: "destructive",
      });
      return;
    }

    // Check if image is still uploading
    if (imageFile && isUploadingImage) {
      addToast({
        title: "Image Uploading",
        description: "Please wait for the image to finish uploading.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = validationResult.data;
      console.log("Submitting Validated Form Data:", {
        ...formData,
        eventDate: format(formData.eventDate, "yyyy-MM-dd")
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      addToast({
        title: "🎉 Event Created!",
        description: "Your event has been successfully created.",
        variant: "success",
      });
      
      // Show celebration animation before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error) {
      console.error("Event creation failed:", error);
      
      addToast({
        title: "❌ Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render error messages
  const renderError = (field: keyof ValidationErrors) => {
    return errors[field] ? (
      <motion.p 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="text-sm text-red-600 mt-1"
      >
        {errors[field]!.join(', ')}
      </motion.p>
    ) : null;
  };

  // Enhanced step indicator component
  const StepIndicator = () => (
    <div className="flex justify-center mb-6 relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0" />
      
      {STEPS.map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isClickable = currentStep > step.id || currentStep === step.id;
        
        return (
          <div key={step.id} className="flex flex-col items-center mx-2 z-10">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => jumpToStep(step.id)}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 mb-1",
                isActive ? "border-primary bg-primary text-primary-foreground" : 
                isCompleted ? "border-primary bg-primary/10 text-primary" : 
                "border-muted bg-background text-muted-foreground",
                isClickable && !isActive && "hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
              
              {isActive && (
                <motion.span
                  layoutId="activeIndicator"
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                />
              )}
            </button>
            
            <span className={cn(
              "text-xs font-medium",
              isActive ? "text-primary" : 
              isCompleted ? "text-primary/80" : 
              "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="min-h-[300px] flex flex-col justify-between"
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Image Upload Section */}
              <div>
                <div className="flex items-center mb-1">
                  <Label htmlFor="eventImage">Event Image (Optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Add an eye-catching image for your event. Recommended size: 1200×630px.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="mt-1 p-4 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-center h-48 relative bg-muted/20 hover:bg-muted/40 transition-colors">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Event preview" className="max-h-full max-w-full object-contain rounded" />
                      <Button 
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/70 hover:bg-background rounded-full h-7 w-7"
                        onClick={removeImage}
                        title="Remove image"
                      >
                        <RemoveIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center w-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Uploading...</p>
                      <div className="w-3/4 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(uploadProgress)}%</p>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                      <Button type="button" variant="link" className="p-0 h-auto">
                        Click to upload an image
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                      <p className="text-xs text-muted-foreground mt-3">Or drag and drop an image here</p>
                    </div>
                  )}
                </div>
                <input 
                  id="eventImage"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                {renderError('imageUrl')}
              </div>

              {/* Event Name Input */}
              <div>
                <div className="flex items-center mb-1">
                  <Label htmlFor="eventName">Event Name *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose a clear, descriptive name for your event.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="eventName"
                  ref={firstInputRef}
                  value={eventName}
                  onChange={(e) => { 
                    setEventName(e.target.value); 
                    setFormTouched({...formTouched, eventName: true});
                  }}
                  placeholder="e.g., Summer BBQ Bash"
                  aria-invalid={!!errors.eventName}
                  className={cn(
                    "transition-all duration-200",
                    errors.eventName ? "border-red-500" : 
                    eventName.length >= 3 ? "border-green-500" : ""
                  )}
                />
                <AnimatePresence>
                  {renderError('eventName')}
                </AnimatePresence>
              </div>
              
              {/* Description Textarea */}
              <div>
                <div className="flex items-center mb-1">
                  <Label htmlFor="description">Description *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Describe your event. Include what attendees should expect and any special instructions.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => { 
                    setDescription(e.target.value); 
                    setFormTouched({...formTouched, description: true});
                  }}
                  placeholder="Tell us more about the event..."
                  rows={4}
                  aria-invalid={!!errors.description}
                  className={cn(
                    "transition-all duration-200",
                    errors.description ? "border-red-500" : 
                    description.length >= 10 ? "border-green-500" : ""
                  )}
                />
                <div className="flex justify-between mt-1">
                  <AnimatePresence>
                    {renderError('description')}
                  </AnimatePresence>
                  <span className={cn(
                    "text-xs",
                    description.length < 10 ? "text-muted-foreground" : "text-green-600"
                  )}>
                    {description.length} / 10+ characters
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center mb-1">
                  <Label htmlFor="eventDate">Date *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the date when your event will take place.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal transition-all duration-200",
                        !eventDate && "text-muted-foreground",
                        errors.eventDate ? "border-red-500" : 
                        eventDate ? "border-green-500" : ""
                      )}
                      aria-invalid={!!errors.eventDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={(date) => { 
                        setEventDate(date); 
                        setFormTouched({...formTouched, eventDate: true});
                      }}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                <AnimatePresence>
                  {renderError('eventDate')}
                </AnimatePresence>
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <Label htmlFor="eventTime">Time *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Set the start time of your event in 24-hour format (HH:MM).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => { 
                    setEventTime(e.target.value); 
                    setFormTouched({...formTouched, eventTime: true});
                  }}
                  aria-invalid={!!errors.eventTime}
                  className={cn(
                    "transition-all duration-200",
                    errors.eventTime ? "border-red-500" : 
                    eventTime ? "border-green-500" : ""
                  )}
                />
                <AnimatePresence>
                  {renderError('eventTime')}
                </AnimatePresence>
              </div>
              
              {/* Calendar preview */}
              {eventDate && eventTime && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-muted/30 rounded-md border mt-4"
                >
                  <h4 className="text-sm font-medium mb-2">Event Preview</h4>
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded p-2 mr-3">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : ""}</p>
                      <p className="text-sm text-muted-foreground">
                        {eventTime ? `at ${eventTime.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                          const hour = parseInt(h);
                          return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
                        })}` : ""}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center mb-1">
                  <Label htmlFor="location">Location / Address *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter the full address or venue name where your event will take place.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="location"
                  ref={firstInputRef}
                  value={location}
                  onChange={(e) => { 
                    setLocation(e.target.value); 
                    setFormTouched({...formTouched, location: true});
                  }}
                  placeholder="e.g., Central Park or 123 Main St"
                  aria-invalid={!!errors.location}
                  className={cn(
                    "transition-all duration-200",
                    errors.location ? "border-red-500" : 
                    location.length >= 5 ? "border-green-500" : ""
                  )}
                />
                <AnimatePresence>
                  {renderError('location')}
                </AnimatePresence>
              </div>
              
              {/* Location suggestions */}
              {location.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-muted-foreground">Suggested locations:</p>
                  <div className="space-y-2">
                    {["Central Park, New York", "Central Library, Main St", "Central Station"].filter(
                      suggestion => suggestion.toLowerCase().includes(location.toLowerCase()) && suggestion !== location
                    ).slice(0, 3).map((suggestion, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setLocation(suggestion)}
                      >
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Map placeholder */}
              {location.length >= 5 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-md overflow-hidden h-[200px] bg-muted/30 flex items-center justify-center"
                >
                  <div className="text-center p-4">
                    <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Map preview would appear here</p>
                    <p className="text-xs text-muted-foreground mt-1">{location}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Review Your Event</h3>
              
              {/* Display potential errors from final validation */}
              <AnimatePresence>
                {(errors.eventName || errors.description || errors.eventDate || errors.eventTime || errors.location) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-md mb-4"
                  >
                    <p className="font-medium text-red-700">Please correct the following issues:</p>
                    <ul className="list-disc list-inside text-red-600 text-xs mt-1">
                      {Object.entries(errors).map(([field, messages]) =>
                        messages?.map((msg, index) => <li key={`${field}-${index}`}>{msg}</li>)
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Event preview card */}
              <div className="border rounded-lg overflow-hidden bg-card">
                {/* Event image */}
                {imageUrl && (
                  <div className="h-40 overflow-hidden bg-muted">
                    <img 
                      src={imagePreview || imageUrl} 
                      alt="Event" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Event details */}
                <div className="p-4">
                  <h4 className="text-xl font-semibold">{eventName || "Untitled Event"}</h4>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">{eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "No date selected"}</p>
                        <p className="text-sm text-muted-foreground">
                          {eventTime ? `at ${eventTime.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                            const hour = parseInt(h);
                            return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
                          })}` : "No time selected"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <p>{location || "No location specified"}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <h5 className="font-medium mb-1">Description</h5>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {description || "No description provided."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 pb-20 pt-8 flex justify-center items-start px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create New Event</CardTitle>
          
          {/* Enhanced step indicator */}
          <StepIndicator />
          
          <Progress 
            value={(currentStep / totalSteps) * 100} 
            className="mt-4 h-2 progress-bar" 
          />
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="py-6">
            {renderStepContent()}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isLoading}
              className="transition-all duration-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="transition-all duration-200"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isLoading}
                className={cn(
                  "transition-all duration-300",
                  isLoading ? "bg-primary/80" : "bg-primary hover:bg-primary/90"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Event
                    <PartyPopper className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
