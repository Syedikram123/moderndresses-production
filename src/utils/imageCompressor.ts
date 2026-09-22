export interface ImageCompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export function compressImage(
  file: File,
  maxDimension: number = 900,
  quality: number = 0.8
): Promise<ImageCompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image with smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxCompressedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize: approxCompressedSize,
          width,
          height
        });
      };

      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface CompressedWebPResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export function compressImageToWebP(
  file: File,
  maxDimension: number = 900,
  quality: number = 0.82
): Promise<CompressedWebPResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                width,
                height,
                originalSize: file.size,
                compressedSize: blob.size,
              });
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve({
                      blob: jpegBlob,
                      width,
                      height,
                      originalSize: file.size,
                      compressedSize: jpegBlob.size,
                    });
                  } else {
                    reject(new Error('Failed to export canvas blob'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function getLocalStorageUsage(): { usedBytes: number; usedFormatted: string; percentEstimate: number } {
  try {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        totalBytes += (key.length + (val ? val.length : 0)) * 2; // UTF-16 characters = 2 bytes
      }
    }

    const kb = totalBytes / 1024;
    const mb = kb / 1024;
    const usedFormatted = mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
    // Typical browser localStorage quota is ~5MB (5242880 bytes)
    const percentEstimate = Math.min(100, Math.round((totalBytes / (5 * 1024 * 1024)) * 100));

    return { usedBytes: totalBytes, usedFormatted, percentEstimate };
  } catch {
    return { usedBytes: 0, usedFormatted: '0 KB', percentEstimate: 0 };
  }
}
