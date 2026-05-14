/**
 * Validates file type and size
 * @param {File} file - File object to validate
 * @param {Object} options - Validation options
 * @returns {{isValid: boolean, error: string|null}}
 */
export const validateUploadFile = (file, options = {}) => {
  const {
    maxSize = 1 * 1024 * 1024, // Default 1MB
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  } = options;

  if (!file) {
    return { isValid: false, error: 'File tidak ditemukan.' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Format file tidak didukung. Gunakan PDF, JPG, atau PNG.' 
    };
  }

  if (file.size > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { 
      isValid: false, 
      error: `Ukuran file terlalu besar. Maksimal ${sizeInMB}MB.` 
    };
  }

  // Prevent potentially executable files even if mime type is spoofed
  const forbiddenExtensions = ['.exe', '.bat', '.sh', '.js', '.php'];
  if (forbiddenExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    return { isValid: false, error: 'Tipe file tidak aman.' };
  }

  return { isValid: true, error: null };
};
