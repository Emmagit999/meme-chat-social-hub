
import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a file (image/video) to Supabase Storage
 * @param {File} file - file from an input
 * @param {'avatars'|'post_media'} bucket - which bucket to upload to
 * @param {string} userId - user's id
 * @returns public URL or null if failed
 */
export async function uploadToStorage(file: File, bucket: "avatars" | "post_media", userId: string): Promise<string | null> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const path = `${userId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrlData?.publicUrl ?? null;
}
