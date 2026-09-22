import { supabase, SUPABASE_BUCKET_NAME, isSupabaseConfigured } from '../../config/supabase';
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
 * Supabase Storage Service for Modern Dresses
 * Handles uploads, URL generation, and cleanup for products, categories, subcategories, and banners.
 * All files are organized cleanly in the 'modern-dresses' bucket with zero orphaned files.
 * Uses secure serverless API for authenticated uploads/deletes, with direct client fallback.
 */
class SupabaseMediaService {
  private bucket = SUPABASE_BUCKET_NAME;

  /**
   * Helper to check if Supabase is ready
   */
  public isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  /**
   * Internal helper: uploads media via secure /api/media serverless endpoint
   */
  private async uploadViaApi(
    path: string,
    blobOrFile: Blob | File,
    contentType = 'image/webp'
  ): Promise<string | null> {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const base64Data = await blobToBase64(blobOrFile);

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'upload',
          path,
          base64Data,
          contentType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.publicUrl) return data.publicUrl;
      }
    } catch (err) {
      console.warn('Upload via /api/media not reachable, falling back to direct client:', err);
    }
    return null;
  }

  /**
   * Internal helper: deletes media via secure /api/media serverless endpoint
   */
  private async deleteViaApi(paths: string[]): Promise<boolean> {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'delete',
          paths,
        }),
      });

      if (response.ok) {
        return true;
      }
    } catch (err) {
      console.warn('Delete via /api/media failed, trying direct:', err);
    }
    return false;
  }

  /**
   * Internal helper: deletes folder via secure /api/media serverless endpoint
   */
  private async deleteFolderViaApi(folderPrefix: string): Promise<boolean> {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'delete-folder',
          folderPrefix,
        }),
      });

      if (response.ok) {
        return true;
      }
    } catch (err) {
      console.warn('Delete folder via /api/media failed:', err);
    }
    return false;
  }

  /**
   * Uploads a product color image to:
   * products/{productId}/colors/{colourId}/{timestamp}_{random}.webp
   */
  public async uploadProductImage(
    productId: string,
    colourId: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanColourId = colourId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
    const path = `products/${cleanProductId}/colors/${cleanColourId}/${filename}`;

    // 1. Try secure Serverless API first
    const apiUrl = await this.uploadViaApi(path, blobOrFile, 'image/webp');
    if (apiUrl) {
      return apiUrl;
    }

    // 2. Direct client fallback
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase Storage is not configured.');
    }

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, blobOrFile, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('Supabase uploadProductImage error:', error);
      throw new Error(`Failed to upload product image: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Uploads a category cover image to:
   * categories/{categoryId}/cover_{timestamp}.webp
   */
  public async uploadCategoryCover(
    categoryId: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanCatId = categoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const path = `categories/${cleanCatId}/cover_${Date.now()}.webp`;

    // 1. Try secure Serverless API first
    const apiUrl = await this.uploadViaApi(path, blobOrFile, 'image/webp');
    if (apiUrl) {
      return apiUrl;
    }

    // 2. Direct client fallback
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase Storage is not configured.');
    }

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, blobOrFile, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('Supabase uploadCategoryCover error:', error);
      throw new Error(`Failed to upload category cover: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Uploads a subcategory cover image to:
   * subcategories/{subcategoryId}/cover_{timestamp}.webp
   */
  public async uploadSubcategoryCover(
    subcategoryId: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanSubId = subcategoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const path = `subcategories/${cleanSubId}/cover_${Date.now()}.webp`;

    // 1. Try secure Serverless API first
    const apiUrl = await this.uploadViaApi(path, blobOrFile, 'image/webp');
    if (apiUrl) {
      return apiUrl;
    }

    // 2. Direct client fallback
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase Storage is not configured.');
    }

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, blobOrFile, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('Supabase uploadSubcategoryCover error:', error);
      throw new Error(`Failed to upload subcategory cover: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Uploads a banner image to:
   * banners/{bannerName}_{timestamp}.webp
   */
  public async uploadBanner(
    bannerName: string,
    blobOrFile: Blob | File
  ): Promise<string> {
    const cleanName = bannerName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const path = `banners/${cleanName}_${Date.now()}.webp`;

    // 1. Try secure Serverless API first
    const apiUrl = await this.uploadViaApi(path, blobOrFile, 'image/webp');
    if (apiUrl) {
      return apiUrl;
    }

    // 2. Direct client fallback
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase Storage is not configured.');
    }

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, blobOrFile, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('Supabase uploadBanner error:', error);
      throw new Error(`Failed to upload banner: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Extracts storage path from a full Supabase public URL
   */
  public getPathFromUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;
    const bucketToken = `/${this.bucket}/`;
    const idx = url.indexOf(bucketToken);
    if (idx !== -1) {
      return decodeURIComponent(url.substring(idx + bucketToken.length).split('?')[0]);
    }
    return null;
  }

  /**
   * Deletes a single media file by URL or path
   */
  public async deleteMediaByUrlOrPath(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;

    const path = urlOrPath.startsWith('http') ? this.getPathFromUrl(urlOrPath) : urlOrPath;
    if (!path) return false;

    // 1. Try secure Serverless API first
    const apiSuccess = await this.deleteViaApi([path]);
    if (apiSuccess) return true;

    // 2. Direct client fallback
    if (!this.isConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.storage.from(this.bucket).remove([path]);
      if (error) {
        console.warn('Supabase direct delete error for path:', path, error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteMedia exception:', err);
      return false;
    }
  }

  /**
   * Recursively deletes all files in a folder prefix (e.g. 'products/{id}')
   */
  public async deleteFolder(folderPrefix: string): Promise<boolean> {
    if (!folderPrefix) return false;

    // 1. Try secure Serverless API first
    const apiSuccess = await this.deleteFolderViaApi(folderPrefix);
    if (apiSuccess) return true;

    // 2. Direct client fallback
    if (!this.isConfigured() || !supabase) return false;

    try {
      // List files in the folder prefix
      const { data: files, error: listError } = await supabase.storage
        .from(this.bucket)
        .list(folderPrefix, { limit: 100 });

      if (listError || !files || files.length === 0) {
        return true;
      }

      const pathsToRemove: string[] = [];
      for (const item of files) {
        if (item.id === null) {
          // It's a subfolder, list subfolder
          const subfolder = `${folderPrefix}/${item.name}`;
          await this.deleteFolder(subfolder);
        } else {
          pathsToRemove.push(`${folderPrefix}/${item.name}`);
        }
      }

      if (pathsToRemove.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(this.bucket)
          .remove(pathsToRemove);

        if (removeError) {
          console.warn('Error removing files in folder:', folderPrefix, removeError);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn('deleteFolder exception:', err);
      return false;
    }
  }

  /**
   * Cleanup all media for a specific product
   */
  public async deleteProductMedia(productId: string): Promise<boolean> {
    const cleanProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return this.deleteFolder(`products/${cleanProductId}`);
  }

  /**
   * Cleanup all media for a specific category
   */
  public async deleteCategoryMedia(categoryId: string, coverUrl?: string): Promise<boolean> {
    if (coverUrl) {
      await this.deleteMediaByUrlOrPath(coverUrl);
    }
    const cleanCatId = categoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return this.deleteFolder(`categories/${cleanCatId}`);
  }

  /**
   * Cleanup all media for a specific subcategory
   */
  public async deleteSubcategoryMedia(subcategoryId: string, coverUrl?: string): Promise<boolean> {
    if (coverUrl) {
      await this.deleteMediaByUrlOrPath(coverUrl);
    }
    const cleanSubId = subcategoryId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return this.deleteFolder(`subcategories/${cleanSubId}`);
  }
}

export const supabaseMediaService = new SupabaseMediaService();

