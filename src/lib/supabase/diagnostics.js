import { supabase } from './client';

/**
 * Diagnose Supabase Storage connectivity and permissions
 * Run this in browser console for debugging
 */
export const diagnosisStorage = async (bucket = 'perjadin-arsip') => {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 1. Check environment variables
  results.checks.environment = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'
  };

  // 2. Check bucket access
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });

    results.checks.bucketAccess = {
      bucket,
      accessible: !error,
      error: error?.message || null,
      hasData: data?.length > 0
    };
  } catch (err) {
    results.checks.bucketAccess = {
      bucket,
      accessible: false,
      error: err.message
    };
  }

  // 3. Check specific folder access
  const folders = ['surat-undangan', 'nota-dinas'];
  for (const folder of folders) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, { limit: 1 });

      results.checks[folder] = {
        exists: !error || error?.message?.includes('not found'),
        error: error?.message || null,
        fileCount: data?.length || 0
      };
    } catch (err) {
      results.checks[folder] = {
        exists: false,
        error: err.message
      };
    }
  }

  // 4. Test signed URL creation
  try {
    // Try to create signed URL for a non-existent file
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl('test/test-file.txt', 3600);

    results.checks.signedUrlGeneration = {
      canGenerate: !error || !error.message?.includes('not found'),
      errorType: error?.message ? 'CONTROLLED' : 'OK'
    };
  } catch (err) {
    results.checks.signedUrlGeneration = {
      canGenerate: false,
      error: err.message
    };
  }

  // 5. Check RLS policies
  results.checks.rls = {
    note: 'RLS policies must allow anon role to read from bucket',
    checklist: [
      'Enable read access for anon role',
      'Verify bucket is not fully restricted',
      'Check storage.objects policy'
    ]
  };

  return results;
};

/**
 * Find orphaned file references in Firestore
 * Files that exist in database but not in storage
 */
export const findOrphanedFiles = async (firebaseDb, bucket = 'perjadin-arsip') => {
  try {
    const { getDocs, collection } = await import('firebase/firestore');
    
    const orphaned = [];
    const checked = [];
    
    // Check perjadinkota collection
    const snapshot = await getDocs(collection(firebaseDb, 'perjadinkota'));
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.suratPath) {
        checked.push(data.suratPath);
        
        const { error } = await supabase.storage
          .from(bucket)
          .list(data.suratPath.split('/').slice(0, -1).join('/'), {
            limit: 1,
            search: data.suratPath.split('/').pop()
          });

        if (error?.message?.includes('not found')) {
          orphaned.push({
            id: doc.id,
            path: data.suratPath,
            type: 'ORPHANED'
          });
        }
      }
    }

    return {
      totalChecked: checked.length,
      orphanedCount: orphaned.length,
      orphaned,
      checkedPaths: checked
    };
  } catch (error) {
    return {
      error: error.message,
      note: 'Make sure firebaseDb is passed correctly'
    };
  }
};

/**
 * Log this object to console to see diagnostics
 * Usage in browser console:
 * import { diagnosisStorage } from '@/lib/supabase/diagnostics'
 * const results = await diagnosisStorage()
 * console.log(results)
 */
