import { supabase } from './client';

/**
 * Checks if a file exists in Supabase Storage
 * @param {string} path - File path in bucket
 * @param {string} bucket - Bucket name
 * @returns {Promise<boolean>}
 */
const fileExists = async (path, bucket = 'perjadin-arsip') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        limit: 1,
        search: path.split('/').pop()
      });

    if (error) {
      console.warn(`Check file exists error: ${error.message}`);
      return false;
    }

    return data?.length > 0;
  } catch (err) {
    console.warn('File existence check failed:', err);
    return false; // Assume file exists to avoid blocking
  }
};

/**
 * Generates a signed URL for a private file with retry logic
 * @param {string} path - File path in bucket
 * @param {number} expiresIn - Expiry time in seconds (default 1 hour)
 * @param {string} bucket - Bucket name (default: perjadin-arsip)
 * @param {number} maxRetries - Number of retry attempts
 * @returns {Promise<string|null>}
 */
export const createSignedUrl = async (path, expiresIn = 3600, bucket = 'perjadin-arsip', maxRetries = 2) => {
  if (!path) {
    console.error('Path tidak diberikan');
    return null;
  }

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration not found in environment variables');
    throw new Error('Konfigurasi Supabase tidak lengkap. Hubungi administrator.');
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        
        // Handle specific errors
        if (errorMsg.includes('not found')) {
          console.error(`File not found in storage: ${path}`);
          throw new Error(`File tidak ditemukan di storage: ${path}`);
        }
        
        if (errorMsg.includes('unauthorized') || errorMsg.includes('permission')) {
          console.error(`Access denied to file: ${path}`);
          throw new Error(`Anda tidak memiliki akses untuk membuka file ini. Hubungi administrator.`);
        }

        if (errorMsg.includes('bucket')) {
          console.error(`Bucket error: ${error.message}`);
          throw new Error(`Bucket storage tidak tersedia. Hubungi administrator.`);
        }

        // Retry on network errors
        if (attempt < maxRetries && errorMsg.includes('fetch')) {
          console.warn(`Network error, retrying... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }

        console.error(`Supabase signed URL error: ${error.message}`);
        throw new Error(`Gagal membuat akses file: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('Signed URL tidak diterima dari server');
      }

      return data.signedUrl;
      
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`Failed after ${maxRetries + 1} attempts:`, err);
        throw err;
      }
      
      console.warn(`Attempt ${attempt + 1} failed, retrying...`, err.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return null;
};
