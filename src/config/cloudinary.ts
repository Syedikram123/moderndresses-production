/**
 * Cloudinary Configuration for Modern Dresses
 * Public settings for client-side asset delivery and signed upload flow.
 * Note: Cloudinary API Secret is strictly server-side (Vercel environment variables).
 */

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzkeh75jx';

export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'modern_dresses';

export const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME);
