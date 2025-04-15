"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Plus,
  X,
  Loader2,
  Upload,
  ImageIcon,
  InfoIcon,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { format } from "date-fns";
import { Label } from "./ui/label";
import { motion } from "framer-motion";

interface EventPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  uploadedAt: string;
  userId: string;
  eventId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username: string;
  };
}

interface EventPhotoGalleryProps {
  eventId: string;
  isHost: boolean;
  isPastEvent: boolean;
  isAttending: boolean;
}

// Switch component for filtering photos
const Switch = ({ 
  checked, 
  onCheckedChange 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
}) => {
  return (
    <div 
      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <div 
        className={`h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} 
      />
    </div>
  );
};

export function EventPhotoGallery({
  eventId,
  isHost,
  isPastEvent,
  isAttending,
}: EventPhotoGalleryProps) {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  
  // Fetch photos
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOnlyMyPhotos, setShowOnlyMyPhotos] = useState(false);
  
  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching photos for event: ${eventId}`);
      const response = await fetch(`/api/events/${eventId}/photos`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to fetch photos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} photos`);
      setPhotos(data);
    } catch (err) {
      console.error("Error fetching photos:", err);
      setError("Could not load photos. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Load photos on mount
  useEffect(() => {
    fetchPhotos();
  }, [eventId, fetchPhotos]);

  // Open photo detail modal
  // Commenting out unused function
  // const openPhotoDetail = useCallback((photo: EventPhoto) => {
  //   setSelectedPhoto(photo);
  // }, []);

  // Open lightbox
  const openLightbox = useCallback((photo: EventPhoto) => {
    setSelectedPhoto(photo);
    setShowLightbox(true);
  }, []);

  // Reset the upload form
  const resetUploadForm = useCallback(() => {
    setCaption("");
    setPreviewUrl(null);
    setFileToUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Handle photo upload
  const handleUpload = useCallback(async () => {
    if (!fileToUpload || !session?.user?.id) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", fileToUpload);
      if (caption) formData.append("caption", caption);

      const response = await fetch(`/api/events/${eventId}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload photo");
      }

      const newPhoto = await response.json();
      setPhotos(prev => [newPhoto, ...prev]);
      
      addToast({
        title: "Success",
        description: "Photo uploaded successfully!",
        variant: "success",
      });
      
      setShowUploadModal(false);
      resetUploadForm();
    } catch (err) {
      console.error("Error uploading photo:", err);
      addToast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [fileToUpload, session?.user?.id, caption, eventId, addToast, resetUploadForm]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      addToast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      addToast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFileToUpload(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [addToast]);

  // Open file picker
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // Can this user upload photos?
  const canUpload = session?.user?.id && (isHost || isAttending);

  // Delete photo
  const handleDeletePhoto = useCallback(async (photoId: string) => {
    try {
      // Close lightbox if the deleted photo is currently being viewed
      if (selectedPhoto?.id === photoId) {
        setShowLightbox(false);
        setSelectedPhoto(null);
      }

      // Optimistic update
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      
      const response = await fetch(`/api/events/${eventId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      addToast({
        title: 'Success',
        description: 'Photo deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Revert the optimistic update
      fetchPhotos();
      addToast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  }, [eventId, setShowLightbox, setPhotos, fetchPhotos, addToast, selectedPhoto?.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading photos...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-2">{error}</p>
        <Button onClick={fetchPhotos} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  const filteredPhotos = showOnlyMyPhotos && session?.user?.id
    ? photos.filter(photo => photo.userId === session.user.id)
    : photos;

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const photoVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with upload button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          Event Photos {photos.length > 0 && `(${photos.length})`}
        </h3>
        
        {canUpload && (
          <Button 
            size="sm" 
            onClick={() => setShowUploadModal(true)}
            className="gap-1"
          >
            <Camera className="h-4 w-4 mr-1" />
            Add Photos
          </Button>
        )}
      </div>

      {/* No photos state */}
      {photos.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
          <ImageIcon className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-muted-foreground mb-2">No photos yet</p>
          
          {!canUpload && !isPastEvent && (
            <p className="text-sm text-muted-foreground/70">
              RSVP to the event to share photos
            </p>
          )}
          
          {canUpload && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUploadModal(true)}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1 text-black" />
             <p className="text-black"> Add the first photo</p>
            </Button>
          )}
          
          {isPastEvent && !canUpload && (
            <p className="text-sm text-muted-foreground/70">
              Only attendees can add photos to past events
            </p>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Switch
            checked={showOnlyMyPhotos}
            onCheckedChange={setShowOnlyMyPhotos}
          />
          <Label htmlFor="show-my-photos">Show only my photos</Label>
        </div>
      )}

      {photos.length > 0 && (
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {filteredPhotos.map((photo) => (
            <motion.div 
              key={photo.id} 
              className="relative aspect-square rounded-md overflow-hidden group cursor-pointer"
              variants={photoVariants}
              onClick={() => openLightbox(photo)}
            >
              <Image
                src={photo.imageUrl}
                alt={photo.caption || "Event photo"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              
              {(isHost || photo.userId === session?.user?.id) && (
                <motion.button
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
              
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white line-clamp-2">{photo.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
            <DialogDescription>
              Share a photo from this event with other attendees.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!previewUrl ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">Click to select a photo</p>
                <p className="text-xs text-muted-foreground/70">Supports JPEG, PNG and WebP</p>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-square relative rounded-md overflow-hidden border">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute top-2 right-2 rounded-full h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
                  onClick={resetUploadForm}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your photo..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadModal(false);
                resetUploadForm();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!previewUrl || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-3xl p-1 sm:p-6 overflow-hidden">
            <div className="relative">
              <Button
                size="icon"
                variant="outline"
                className="absolute top-2 right-2 z-10 rounded-full h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo */}
                <div className="aspect-square relative rounded-md overflow-hidden">
                  <Image
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.caption || "Event photo"}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Photo Info */}
                <div className="p-4 flex flex-col">
                  {/* User and timestamp */}
                  <div className="mb-4">
                    <div className="flex items-center">
                      <Link href={`/users/${selectedPhoto.user.id}`} className="flex items-center group">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={selectedPhoto.user.image || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {selectedPhoto.user.name || selectedPhoto.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(selectedPhoto.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Caption */}
                  {selectedPhoto.caption && (
                    <p className="text-sm mb-4 flex-grow">{selectedPhoto.caption}</p>
                  )}
                  
                  {/* Share button (future feature) */}
                  <div className="mt-auto pt-4 border-t">
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Photo sharing coming soon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-5xl w-[95vw] p-1 sm:p-2 bg-black/95 backdrop-blur-sm">
          <DialogHeader className="absolute top-2 right-2 z-10">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 bg-black/50 text-white hover:bg-black/70 rounded-full"
              onClick={() => setShowLightbox(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          {selectedPhoto && (
            <motion.div 
              className="flex flex-col h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative overflow-hidden flex-1 flex items-center justify-center">
                <motion.div 
                  className="relative h-[80vh] w-full"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                  <Image
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.caption || "Event photo"}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                  />
                </motion.div>
              </div>
              
              {/* Info bar */}
              <motion.div 
                className="p-3 flex justify-between items-center bg-background/80 backdrop-blur-sm rounded-lg mt-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={selectedPhoto.user.image || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {selectedPhoto.user.name || selectedPhoto.user.username}
                    </p>
                    {selectedPhoto.caption && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                        {selectedPhoto.caption}
                      </p>
                    )}
                  </div>
                </div>
                
                {(isHost || session?.user?.id === selectedPhoto.userId) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      handleDeletePhoto(selectedPhoto.id);
                      setShowLightbox(false);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}