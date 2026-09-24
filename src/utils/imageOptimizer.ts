/**
 * Cloudinary & Web Image Optimization Helper for Modern Dresses
 * Transforms remote image URLs to use automatic format (WebP/AVIF),
 * automatic quality, and responsive width constraints.
 */

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  crop?: 'limit' | 'fill' | 'scale' | 'thumb';
}

export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageOptimizeOptions = {}
): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
  }

  const { width = 600, quality = 'auto', format = 'auto', crop = 'limit' } = options;

  // 1. Data URLs / base64 / local asset paths: return as-is
  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('./')) {
    return url;
  }

  // 2. Cloudinary URLs
  // Standard format: https://res.cloudinary.com/<cloud_name>/image/upload/[transforms/]v<version>/<public_id>.<ext>
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    const uploadTag = '/image/upload/';
    const uploadIndex = url.indexOf(uploadTag);
    const prefix = url.substring(0, uploadIndex + uploadTag.length);
    let suffix = url.substring(uploadIndex + uploadTag.length);

    // Build transformation string
    const transforms = [`f_${format}`, `q_${quality}`];
    if (width) transforms.push(`w_${width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (crop) transforms.push(`c_${crop}`);

    const transformStr = transforms.join(',') + '/';

    // If suffix already has transformation parameters right at the start, replace them
    if (/^[a-z]_[a-z0-9_]+,/i.test(suffix)) {
      const firstSlash = suffix.indexOf('/');
      suffix = suffix.substring(firstSlash + 1);
    }

    return prefix + transformStr + suffix;
  }

  // 3. Unsplash URLs
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('q', typeof quality === 'number' ? quality.toString() : '80');
      if (width) u.searchParams.set('w', width.toString());
      if (options.height) u.searchParams.set('h', options.height.toString());
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}
