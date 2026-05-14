import { supabase } from './client';

/**
 * Deletes a file from Supabase Storage
 * @param {string} path - File path in bucket
 * @param {string} bucket - Bucket name (default: perjadin-arsip)
 * @returns {Promise<boolean>}
 */
export const deleteFile = async (path, bucket = 'perjadin-arsip') => {
  if (!path) return false;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Supabase delete error:', error);
    return false;
  }

  return true;
};
