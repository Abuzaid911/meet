"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ui/use-toast"; // Corrected path
import { Button } from "../../components/ui/button"; // Corrected path
import { Input } from "../../components/ui/input"; // Corrected path
import { Textarea } from "../../components/ui/textarea"; // Corrected path
import { Label } from "../../components/ui/label"; // Corrected path
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"; // Corrected path
import { Progress } from "../../components/ui/progress"; // Corrected path
import { ChevronLeft, ChevronRight, PartyPopper, Calendar as CalendarIcon, ImagePlus, X as RemoveIcon } from "lucide-react"; // Added CalendarIcon and ImagePlus
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"; // Corrected path
import { Calendar } from "../../components/ui/calendar"; // Corrected path
import { format } from "date-fns";
import { cn } from "../../../lib/utils"; // Assuming utils path
import { z } from "zod"; // Import zod
import { Loader2 } from "lucide-react"; // Added Loader2

// --- Zod Schemas ---
const step1Schema = z.object({
  eventName: z.string().min(3, { message: "Event name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  imageUrl: z.string().url({ message: "Invalid image URL." }).optional().or(z.literal("")), // Optional image URL
});

const step2Schema = z.object({
  eventDate: z.date({ required_error: "Please select a date." }),
  // Basic time validation (HH:MM format) - more robust validation might be needed
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
});

const step3Schema = z.object({
  location: z.string().min(5, { message: "Location must be at least 5 characters." }),
});

// Combine schemas including imageUrl
const eventSchema = step1Schema.merge(step2Schema).merge(step3Schema);

// Type for validation errors state
type ValidationErrors = {
  eventName?: string[];
  description?: string[];
  imageUrl?: string[]; // Add imageUrl errors
  eventDate?: string[];
  eventTime?: string[];
  location?: string[];
};

export default function CreateEventPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({}); // State for errors

  // Form state
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null); // State for selected file
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview URL
  const [isUploadingImage, setIsUploadingImage] = useState(false); // Uploading indicator
  const [imageUrl, setImageUrl] = useState<string>(""); // Final image URL after upload

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;

  const validateStep = (step: number) => {
    let result;
    let dataToValidate;

    setErrors({}); // Clear previous errors for the current validation attempt

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
        return true; // No validation for review step or unknown steps
    }

    if (!result.success) {
      const fieldErrors: ValidationErrors = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof ValidationErrors;
        if (path) {
            fieldErrors[path] = fieldErrors[path] ? [...fieldErrors[path]!, issue.message] : [issue.message];
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    return true;
  };


  const handleNextStep = () => {
    if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    } else {
        addToast({ title: "Validation Error", description: "Please fix the errors before proceeding.", variant: "destructive" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setErrors({}); // Clear errors when going back
      setCurrentStep(currentStep - 1);
    }
  };

  // --- Image Handling Logic ---
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (can be expanded)
      if (!file.type.startsWith('image/')) {
        addToast({ title: "Invalid File Type", description: "Please select an image.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         addToast({ title: "File Too Large", description: "Image must be smaller than 5MB.", variant: "destructive" });
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Reset final URL until uploaded
      setImageUrl(""); 
      // Clear potential previous URL errors if user selects a file
      setErrors(prev => ({ ...prev, imageUrl: undefined }));
      // **Simulate Upload** - Replace with actual upload logic
      handleImageUpload(file);
    }
  };

  // **MOCK UPLOAD FUNCTION** - Replace with your actual upload service call
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    console.log("Simulating image upload for:", file.name);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real app: Upload file to S3/Cloudinary/etc., get the URL
      const uploadedUrl = `/images/placeholder-event-${Date.now()}.jpg`; // Replace with actual URL
      console.log("Simulated upload successful, URL:", uploadedUrl);
      setImageUrl(uploadedUrl);
       addToast({ title: "Image Uploaded", description: "Placeholder image URL generated.", variant: "success" });
    } catch (error) {
      console.error("Simulated upload failed:", error);
      addToast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
       // Clear states if upload fails
       setImageFile(null);
       setImagePreview(null);
       setImageUrl("");
    } finally {
      setIsUploadingImage(false);
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
           fileInputRef.current.value = ""; // Reset file input
       }
   };
  // --- End Image Handling ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps, including the potentially empty imageUrl
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
        // Focus the first step with an error (optional enhancement)
        if (fieldErrors.eventName || fieldErrors.description) setCurrentStep(1);
        else if (fieldErrors.eventDate || fieldErrors.eventTime) setCurrentStep(2);
        else if (fieldErrors.location) setCurrentStep(3);

        addToast({ title: "Incomplete Form", description: "Please review the highlighted errors.", variant: "destructive" });
        return;
    }

    // Check if image is selected but still uploading
    if (imageFile && isUploadingImage) {
       addToast({ title: "Image Uploading", description: "Please wait for the image to finish uploading.", variant: "default" });
       return;
    }

    setIsLoading(true);
    try {
      const formData = validationResult.data; 
      console.log("Submitting Validated Form Data:", {
          ...formData,
          // Make sure imageUrl is included (it's already in formData)
          eventDate: format(formData.eventDate, "yyyy-MM-dd") 
      });
       // --- MOCK API CALL ---
      await new Promise(resolve => setTimeout(resolve, 1500));
      // --- END MOCK API CALL ---

      addToast({
        title: "🎉 Event Created!",
        description: "Your event has been successfully created.",
        variant: "success",
      });
      router.push('/dashboard');

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
          <p className="text-sm text-red-600 mt-1">{errors[field]!.join(', ')}</p>
      ) : null;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Event Details
        return (
          <div className="space-y-6"> {/* Increased spacing */}
             {/* Image Upload Section */}
            <div>
                <Label htmlFor="eventImage">Event Image (Optional)</Label>
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
                        <div className="flex flex-col items-center justify-center">
                           <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                           <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                    ) : (
                       <>
                            <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                            <Button type="button" variant="link" onClick={triggerFileInput}>
                                Click to upload an image
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                       </>
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
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => { setEventName(e.target.value); if (errors.eventName) validateStep(1); }}
                placeholder="e.g., Summer BBQ Bash"
                aria-invalid={!!errors.eventName}
                className={errors.eventName ? "border-red-500" : ""}
              />
              {renderError('eventName')}
            </div>
             {/* Description Textarea */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (errors.description) validateStep(1); }}
                placeholder="Tell us more about the event..."
                rows={4}
                 aria-invalid={!!errors.description}
                 className={errors.description ? "border-red-500" : ""}
              />
               {renderError('description')}
            </div>
          </div>
        );
      case 2: // Date & Time
        return (
          <div className="space-y-4">
             <div className="flex flex-col space-y-1.5">
               <Label htmlFor="eventDate">Date *</Label>
               <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventDate && "text-muted-foreground",
                        errors.eventDate ? "border-red-500" : ""
                      )}
                       aria-invalid={!!errors.eventDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={(date) => { setEventDate(date); if (errors.eventDate) validateStep(2); }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {renderError('eventDate')}
             </div>
             <div>
               <Label htmlFor="eventTime">Time *</Label>
               <Input
                 id="eventTime"
                 type="time"
                 value={eventTime}
                 onChange={(e) => { setEventTime(e.target.value); if (errors.eventTime) validateStep(2); }}
                 aria-invalid={!!errors.eventTime}
                 className={errors.eventTime ? "border-red-500" : ""}
               />
               {renderError('eventTime')}
             </div>
          </div>
        );
       case 3: // Location
         return (
           <div className="space-y-4">
             <div>
               <Label htmlFor="location">Location / Address *</Label>
               <Input
                 id="location"
                 value={location}
                 onChange={(e) => { setLocation(e.target.value); if (errors.location) validateStep(3); }}
                 placeholder="e.g., Central Park or 123 Main St"
                 aria-invalid={!!errors.location}
                 className={errors.location ? "border-red-500" : ""}
               />
                {renderError('location')}
             </div>
           </div>
         );
       case 4: // Review & Submit
         return (
            <div className="space-y-3 text-sm"> {/* Increased spacing */}
               <h3 className="font-semibold text-lg mb-3 border-b pb-2">Review Your Event</h3>
                {/* Display potential errors from final validation */}
                {(errors.eventName || errors.description || errors.eventDate || errors.eventTime || errors.location) && (
                   <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                       <p className="font-medium text-red-700">Please correct the following issues:</p>
                       <ul className="list-disc list-inside text-red-600 text-xs mt-1">
                           {Object.entries(errors).map(([field, messages]) =>
                              messages?.map((msg, index) => <li key={`${field}-${index}`}>{msg}</li>)
                           )}
                       </ul>
                   </div>
                )}
                {imageUrl && (
                  <div className="mb-3">
                      <strong className="font-medium w-24 inline-block">Image:</strong>
                      <img src={imageUrl} alt="Event image" className="mt-1 max-w-[200px] max-h-[100px] rounded object-cover border" />
                  </div>
                )}
                <p><strong className="font-medium w-24 inline-block">Name:</strong> {eventName || "-"}</p>
                <p><strong className="font-medium w-24 inline-block">Date:</strong> {eventDate ? format(eventDate, "PPP") : "-"}</p>
                <p><strong className="font-medium w-24 inline-block">Time:</strong> {eventTime || "-"}</p>
                <p><strong className="font-medium w-24 inline-block">Location:</strong> {location || "-"}</p>
                <p><strong className="font-medium w-24 inline-block">Description:</strong></p>
                <p className="pl-4 text-muted-foreground">{description || "-"}</p>
             </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 pb-20 pt-8 flex justify-center items-start px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create New Event</CardTitle>
          <Progress value={(currentStep / totalSteps) * 100} className="mt-4 h-2" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="min-h-[250px] py-6">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Event"}
                {!isLoading && <PartyPopper className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 