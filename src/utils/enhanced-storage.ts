import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
  uploadedUrl?: string;
}

/**
 * Enhanced file upload with progress tracking and error handling
 */
export async function uploadToStorageWithProgress(
  file: File, 
  bucket: "avatars" | "post_media", 
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string | null> {
  
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const path = `${userId}/${timestamp}.${ext}`;

  try {
    // Start upload
    onProgress?.({ progress: 0, isUploading: true });

    // Simulate progress updates (since Supabase doesn't provide real upload progress)
    const progressInterval = setInterval(() => {
      onProgress?.({ progress: Math.random() * 80 + 10, isUploading: true });
    }, 200);

    const { error, data } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    clearInterval(progressInterval);

    if (error) {
      console.error("Upload error:", error);
      onProgress?.({ 
        progress: 0, 
        isUploading: false, 
        error: getUploadErrorMessage(error) 
      });
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      onProgress?.({ 
        progress: 0, 
        isUploading: false, 
        error: 'Failed to get public URL for uploaded file' 
      });
      return null;
    }

    // Complete
    onProgress?.({ 
      progress: 100, 
      isUploading: false, 
      uploadedUrl: publicUrl 
    });

    return publicUrl;

  } catch (error: any) {
    onProgress?.({ 
      progress: 0, 
      isUploading: false, 
      error: error.message || 'Upload failed due to an unexpected error' 
    });
    return null;
  }
}

/**
 * Convert Supabase storage errors to user-friendly messages
 */
function getUploadErrorMessage(error: any): string {
  if (error.message?.includes('limit')) {
    return 'File size too large. Please choose a smaller file.';
  }
  if (error.message?.includes('format') || error.message?.includes('type')) {
    return 'File type not supported. Please choose a different file.';
  }
  if (error.message?.includes('network') || error.message?.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (error.message?.includes('permission') || error.message?.includes('authorization')) {
    return 'Permission denied. Please log in and try again.';
  }
  if (error.message?.includes('quota') || error.message?.includes('storage')) {
    return 'Storage quota exceeded. Please contact support.';
  }
  
  return error.message || 'Upload failed. Please try again.';
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, type: 'image' | 'video'): string | null {
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
  };

  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  };

  if (file.size > maxSizes[type]) {
    const maxSizeMB = maxSizes[type] / (1024 * 1024);
    return `File size exceeds ${maxSizeMB}MB limit.`;
  }

  if (!allowedTypes[type].includes(file.type)) {
    return `File type not supported. Please choose a valid ${type} file.`;
  }

  return null;
}