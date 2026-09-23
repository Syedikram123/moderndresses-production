import { CLOUDINARY_CLOUD_NAME, isCloudinaryConfigured } from '../../config/cloudinary';
import { auth } from '../../config/firebase';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Extracts the Cloudinary Public ID from a full Cloudinary delivery URL or raw ID
 * Examples:
 * - "https://res.cloudinary.com/dzkeh75jx/image/upload/v1727000/modern_dresses/products/p1/img.webp"
 *   -> "modern_dresses/products/p1/img"
 * - "modern_dresses/banners/hero_1" -> "modern_dresses/banners/hero_1"
 */
export function getCloudinaryPublicId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://')) {
    return urlOrId.replace(/\.[a-zA-Z0-9]+$/, '');
  }
  // Match Cloudinary URL structure
  const match = urlOrId.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Cloudinary Media Service for Modern Dresses
 * Handles optimized image uploads and privileged asset cleanup via secure serverless API.
 */
class CloudinaryMediaService {
  public isConfigured(): boolean {
    return isCloudinaryConfigured;
  }

  /**
   * Internal helper to dispatch upload request to /api/media
   */
  private async uploadViaApi(
    folder: string,
    publicId: string,
    blobOrFile: Blob | File,
    contentType = 'image/webp'
  ): Promise<string> {
    let token = await auth?.currentUser?.getIdToken();
    if (!token && auth?.currentUser) {
      token = await auth.currentUser.getIdToken(true);
    }

    if (!token) {
      throw new Error('Admin authentication session required to upload media.');
    }

    const base64Data = await blobToBase64(blobOrFile);

    let response: Response;
    try {
      response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'upload',
          folder,
          publicId,
          base64Data,
          contentType,
        }),
      });
    } catch (networkErr: any) {
      console.error('Network error calling media API:', networkErr);
      throw new Error(`Media API connection error: ${networkErr.message || 'Server unreachable'}`);
    }

    const resJson = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        resJson?.error ||
        `Cloudinary upload error (Status ${response.status}: ${response.statusText})`;
      console.error('Cloudinary upload failed:', errorMsg);
      throw new Error(errorMsg);
    }

    if (resJson?.publicUrl) {
      return resJson.publicUrl;
    }

    throw new Error('Upload succeeded on Cloudinary, but no public URL was returned.');
  }

  /**
   * Internal helper to dispatch delete request to /api/media
   */
  private async deleteViaApi(publicIds: string[]): Promise<boolean> {
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) return false;

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          publicIds,
        }),
      });

      if (response.ok) {
        return true;
      }

      const resJson = await response.json().catch(() => null);
      console.warn('Cloudinary delete error:', resJson?.error || response.statusText);
      return false;
    } catch (err) {
      console.warn('Cloudinary delete network error:', err);
      return false;
    }
  }

  /**
   * Internal helper to dispatch folder deletion to /api/media
   */
  private async deleteFolderViaApi(folderPrefix: string): Promise<boolean> {
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) return false;

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'delete-folder',
          folderPrefix,
        }),
      });

      return response.ok;
    } catch (err) {
      console.warn('Cloudinary delete-folder network error:', err);
      return false;
    }
  }

  /**
   * Extracts public ID from full Cloudinary URL
   */
  public getPublicIdFromUrl(url: string): string | null {
    return getCloudinaryPublicId(url);
  }

  /**
   * Uploads a product color image
   * Folder: modern_dresses/products/{productId}/colors/{colourId}
   */
  public async uploadProductImage(
    productId: string,
    colourId: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanColourId = colourId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const folder = `modern_dresses/products/${cleanProductId}/colors/${cleanColourId}`;

    return this.uploadViaApi(folder, filename, blobOrFile, 'image/webp');
  }

  /**
   * Uploads a category cover image
   * Folder: modern_dresses/categories/{categoryId}
   */
  public async uploadCategoryCover(
    categoryId: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanCatId = categoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const folder = `modern_dresses/categories/${cleanCatId}`;
    const filename = `cover_${Date.now()}`;

    return this.uploadViaApi(folder, filename, blobOrFile, 'image/webp');
  }

  /**
   * Uploads a subcategory cover image
   * Folder: modern_dresses/subcategories/{subcategoryId}
   */
  public async uploadSubcategoryCover(
    subcategoryId: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanSubId = subcategoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const folder = `modern_dresses/subcategories/${cleanSubId}`;
    const filename = `cover_${Date.now()}`;

    return this.uploadViaApi(folder, filename, blobOrFile, 'image/webp');
  }

  /**
   * Uploads a banner image
   * Folder: modern_dresses/banners
   */
  public async uploadBanner(
    bannerName: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanName = bannerName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const folder = 'modern_dresses/banners';
    const filename = `${cleanName}_${Date.now()}`;

    return this.uploadViaApi(folder, filename, blobOrFile, 'image/webp');
  }

  /**
   * Deletes a single media file by URL or Public ID
   */
  public async deleteMediaByUrlOrPublicId(urlOrPublicId: string): Promise<boolean> {
    if (!urlOrPublicId) return false;
    const publicId = this.getPublicIdFromUrl(urlOrPublicId) || urlOrPublicId;
    if (!publicId) return false;

    return this.deleteViaApi([publicId]);
  }

  /**
   * Backward-compatibility alias for deleteMediaByUrlOrPath
   */
  public async deleteMediaByUrlOrPath(urlOrPath: string): Promise<boolean> {
    return this.deleteMediaByUrlOrPublicId(urlOrPath);
  }

  /**
   * Cleanup all media for a specific product
   */
  public async deleteProductMedia(productId: string): Promise<boolean> {
    const cleanProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return this.deleteFolderViaApi(`modern_dresses/products/${cleanProductId}`);
  }

  /**
   * Cleanup all media for a specific category
   */
  public async deleteCategoryMedia(categoryId: string, coverUrl?: string): Promise<boolean> {
    if (coverUrl) {
      await this.deleteMediaByUrlOrPublicId(coverUrl);
    }
    const cleanCatId = categoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return this.deleteFolderViaApi(`modern_dresses/categories/${cleanCatId}`);
  }

  /**
   * Cleanup all media for a specific subcategory
   */
  public async deleteSubcategoryMedia(subcategoryId: string, coverUrl?: string): Promise<boolean> {
    if (coverUrl) {
      await this.deleteMediaByUrlOrPublicId(coverUrl);
    }
    const cleanSubId = subcategoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return this.deleteFolderViaApi(`modern_dresses/subcategories/${cleanSubId}`);
  }
}

export const cloudinaryMediaService = new CloudinaryMediaService();
