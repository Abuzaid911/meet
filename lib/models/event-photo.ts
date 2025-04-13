// Define the core fields that are always present
export interface EventPhotoBase {
  id: string;
  imageUrl: string;
  caption?: string | null;
  uploadedAt: Date;
  eventId: string;
  userId: string;
  likeCount: number;
}

// Define the extended fields that may be present
export interface EventPhotoExtended extends EventPhotoBase {
  storageKey?: string | null;
  user?: {
    id: string;
    name?: string | null;
    image?: string | null;
    username: string;
  };
}

// Type guard to check if a field exists
export const hasStorageKey = (photo: EventPhotoBase): photo is EventPhotoExtended & { storageKey: string } => {
  return 'storageKey' in photo && !!photo.storageKey;
};

// Safely access the storage key
export const getStorageKey = (photo: EventPhotoBase): string | null => {
  if (hasStorageKey(photo)) {
    return photo.storageKey;
  }
  
  // Fallback: extract key from imageUrl if storageKey is not available
  try {
    const url = new URL(photo.imageUrl);
    return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
  } catch (error) {
    console.error('Failed to extract storage key from URL:', error);
    return null;
  }
}; 