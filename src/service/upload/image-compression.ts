/**
 * Compresses an image file using HTML canvas for better performance and control
 * @param file The image file to compress
 * @param maxSize Maximum file size in bytes (default: 256KB)
 * @param maxWidth Maximum width in pixels (default: 512)
 * @param maxHeight Maximum height in pixels (default: 512)
 * @returns Promise with the compressed file or original if compression fails
 */
export async function compressImage(
  file: File,
  maxWidth: number = 512,
  maxHeight: number = 512,
): Promise<File> {
  try {
    // Only compress image files
    if (!file.type.startsWith('image/')) {
      return file;
    }

    // Read the image file
    const imageBitmap = await createImageBitmap(file);
    
    // Calculate dimensions while maintaining aspect ratio
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    
    // Resize if needed
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    if (ratio < 1) {
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return file;
    }

    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert to blob
    const quality = 0.85;
    const blob = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob(resolve, file.type, quality),
    );

    if (!blob) {
      return file;
    }

    // Create a new File object with the compressed blob
    return new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.warn('Image compression failed, using original file:', error);
    return file;
  }
}

/**
 * Checks if a file needs compression based on size and type
 * @param file The file to check
 * @param maxSize Maximum file size in bytes
 * @returns boolean indicating if compression is needed
 */
export function needsImageCompression(file: File, maxSize: number = 256 * 1024): boolean {
  // Only check image files
  if (!file.type.startsWith('image/')) {
    return false;
  }
  
  return file.size > maxSize;
}
