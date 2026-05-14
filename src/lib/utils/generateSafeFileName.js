/**
 * Generates a safe filename by appending a timestamp and removing special characters
 * @param {string} originalName - Original filename
 * @returns {string} - Safe filename: timestamp-sanitizedname.ext
 */
export const generateSafeFileName = (originalName) => {
  const timestamp = Date.now();
  // Remove special characters and spaces, but keep the extension
  const cleanName = originalName
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return `${timestamp}-${cleanName}`;
};
