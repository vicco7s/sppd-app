import { supabase } from './client';
import { generateSafeFileName } from '../utils/generateSafeFileName';

/**
 * Uploads a file to Supabase Storage
 * @param {File} file - File object to upload
 * @param {string} folder - Target folder in bucket (surat-undangan, nota-dinas, lampiran)
 * @param {string} bucket - Bucket name (default: perjadin-arsip)
 * @returns {Promise<{path: string, fileName: string}>}
 */
export const uploadFile = async (file, folder = 'surat-undangan', bucket = 'perjadin-arsip') => {
  if (!file) throw new Error('No file provided');

  const fileName = generateSafeFileName(file.name);
  const path = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(error.message || 'Gagal upload ke Supabase Storage');
  }

  return {
    path: data.path,
    fileName: fileName
  };
};
