import { supabase } from './client';

/**
 * Generates a signed URL for a private file
 * @param {string} path - File path in bucket
 * @param {number} expiresIn - Expiry time in seconds (default 1 hour)
 * @param {string} bucket - Bucket name (default: perjadin-arsip)
 * @returns {Promise<string|null>}
 */
export const createSignedUrl = async (path, expiresIn = 3600, bucket = 'perjadin-arsip') => {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Supabase signed URL error:', error);
    return null;
  }

  return data.signedUrl;
};
