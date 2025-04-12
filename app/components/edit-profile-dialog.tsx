'use client';

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// UI Components
import { Button } from "./ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Loader2, Save } from "lucide-react";

// Define a validation schema using Zod
const profileSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(50, { message: "Name cannot exceed 50 characters" }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username cannot exceed 30 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  bio: z.string().max(160, { message: "Bio cannot exceed 160 characters" }).optional(),
});

// Define the type for form data based on the schema
export type ProfileFormData = z.infer<typeof profileSchema>;

// Component Props
interface EditProfileDialogProps {
  profile: {
    id: string;
    name: string | null;
    username: string | null;
    bio: string | null;
    email?: string | null;
    image?: string | null;
    createdAt?: string;
  } | null;
  onSaveChanges: (data: ProfileFormData) => Promise<void>;
}

// The Improved Component
export function EditProfileDialogContent({ profile, onSaveChanges }: EditProfileDialogProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
    },
  });
  
  // Focus the name input when the dialog opens
  useEffect(() => {
    if (nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Wrapper function for submission to handle potential API errors
  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      await onSaveChanges(data);
    } catch (error: unknown) {
      console.error("Failed to save profile:", error);
      setError("root.serverError", {
        type: "manual",
        message: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
      });
    }
  };
  
  // Handle ESC key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Let the Dialog handle this natively
      return;
    }
  };

  return (
    <DialogContent 
      className="sm:max-w-[425px]"
      onKeyDown={handleKeyDown}
      onInteractOutside={(e) => {
        // Prevent accidental dismissal when focusing on form fields
        if (isSubmitting) {
          e.preventDefault();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when you&apos;re done.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
        {/* Name Field */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <div className="col-span-3">
            <Input
              id="name"
              className={errors.name ? 'border-red-500' : ''}
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
              placeholder="Your full name"
              ref={(element) => {
                // Handle the ref properly
                register("name").ref(element);
                nameInputRef.current = element;
              }}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
        </div>

        {/* Username Field */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username
          </Label>
          <div className="col-span-3">
            <Input
              id="username"
              className={errors.username ? 'border-red-500' : ''}
              aria-invalid={errors.username ? "true" : "false"}
              {...register("username")}
              placeholder="Your unique username"
            />
            {errors.username && (
              <p className="text-sm text-red-600 mt-1" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>
        </div>

        {/* Bio Field */}
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="bio" className="text-right pt-2">
            Bio
          </Label>
          <div className="col-span-3">
            <Textarea
              id="bio"
              rows={3}
              className={errors.bio ? 'border-red-500' : ''}
              aria-invalid={errors.bio ? "true" : "false"}
              {...register("bio")}
              placeholder="Tell us a little about yourself"
            />
            {errors.bio && (
              <p className="text-sm text-red-600 mt-1" role="alert">
                {errors.bio.message}
              </p>
            )}
          </div>
        </div>

        {/* Display general server errors */}
        {errors.root?.serverError && (
          <p className="text-sm text-red-600 mt-1 text-center col-span-4" role="alert">
            {errors.root.serverError.message}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
} 