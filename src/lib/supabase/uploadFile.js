import { supabase } from './client';
import { generateSafeFileName } from '../utils/generateSafeFileName';

/**
 * Uploads a file to Supabase Storage with retry logic for network errors
 * @param {File} file - File object to upload
 * @param {string} folder - Target folder in bucket (surat-undangan, nota-dinas, lampiran)
 * @param {string} bucket - Bucket name (default: perjadin-arsip)
 * @param {number} maxRetries - Number of retry attempts for network errors
 * @returns {Promise<{path: string, fileName: string}>}
 */
export const uploadFile = async (file, folder = 'surat-undangan', bucket = 'perjadin-arsip', maxRetries = 3) => {
  if (!file) throw new Error('No file provided');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration not found in environment variables');
    throw new Error('Konfigurasi Supabase tidak lengkap. Hubungi administrator.');
  }

  const fileName = generateSafeFileName(file.name);
  const path = `${folder}/${fileName}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';

        // Specific bucket errors
        if (errorMsg.includes('bucket')) {
          console.error(`Bucket error: ${error.message}`);
          throw new Error(`Bucket storage tidak tersedia. Periksa nama bucket '${bucket}'.`);
        }

        // Permission errors (RLS policies)
        if (errorMsg.includes('unauthorized') || errorMsg.includes('permission') || errorMsg.includes('row level security')) {
          console.error(`Permission denied to upload to bucket: ${bucket}`);
          throw new Error('Anda tidak memiliki izin untuk mengunggah file. Hubungi administrator.');
        }

        // File already exists (upsert: false)
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          console.error(`File already exists: ${path}`);
          throw new Error('File dengan nama yang sama sudah ada. Coba ganti nama file.');
        }

        // Network error (Failed to fetch) - retry with backoff
        if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
          if (attempt < maxRetries) {
            console.warn(`Network error, retrying... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }
          console.error('Network error persisting after retries', { supabaseUrl });
          throw new Error(
            `Gagal terhubung ke server penyimpanan (${supabaseUrl}). Periksa apakah proyek Supabase aktif/tidak di-pause, dan koneksi internet Anda.`
          );
        }

        console.error('Supabase upload error:', error);
        throw new Error(error.message || 'Gagal upload ke Supabase Storage');
      }

      if (!data?.path) {
        throw new Error('Path upload tidak diterima dari server');
      }

      return {
        path: data.path,
        fileName: fileName
      };
    } catch (err) {
      // Re-throw meaningful errors (bucket, permission, existing file, etc.)
      if (err.message && !/fetched|Failed to fetch|network/i.test(err.message)) {
        throw err;
      }

      // Network/retryable errors
      if (attempt === maxRetries) {
        console.error(`Upload failed after ${maxRetries + 1} attempts:`, err);
        throw new Error('Gagal mengunggah file. Silakan periksa koneksi dan coba lagi.');
      }

      console.warn(`Upload attempt ${attempt + 1} failed, retrying...`, err.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return null;
};
