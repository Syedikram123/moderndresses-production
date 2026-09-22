import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { IStorageService } from './IStorageService';
import {
  Category,
  Subcategory,
  Product,
  HomepageSettings,
  StoreSettings,
  StorageDataBackup,
} from '../../types';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { LocalStorageService } from './LocalStorageService';
import { supabaseMediaService } from './SupabaseMediaService';
import { runInitialMigrationIfEmpty } from './migrationService';
import { generateProductId, slugify } from '../../utils/formatters';
import { LOCAL_STORAGE_SEED } from '../../data/localStorageSeed';
import { getLocalStorageUsage } from '../../utils/imageCompressor';

/**
 * Production Storage Service for Modern Dresses
 * Cloud Firestore is the SINGLE authoritative source of truth.
 * LocalStorage is NOT a parallel database and cannot overwrite Firestore.
 */
class FirestoreStorageServiceImpl implements IStorageService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (isFirebaseConfigured && db) {
      try {
        await runInitialMigrationIfEmpty();
      } catch (err) {
        console.warn('Initial migration check failed, using existing Firestore data:', err);
      }
    } else {
      // Local development fallback only when Firebase is not configured
      await LocalStorageService.initialize();
    }

    this.isInitialized = true;
  }

  async resetDemoData(): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      return LocalStorageService.resetDemoData();
    }

    try {
      const batch = writeBatch(db);

      // Re-seed categories
      for (const cat of LOCAL_STORAGE_SEED.categories) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }

      // Re-seed subcategories
      for (const sub of LOCAL_STORAGE_SEED.subcategories) {
        batch.set(doc(db, 'subcategories', sub.id), sub);
      }

      // Re-seed products
      for (const prod of LOCAL_STORAGE_SEED.products) {
        batch.set(doc(db, 'products', prod.id), prod);
      }

      // Re-seed settings
      batch.set(doc(db, 'settings', 'store_settings'), LOCAL_STORAGE_SEED.storeSettings);
      batch.set(doc(db, 'settings', 'homepage'), LOCAL_STORAGE_SEED.homepageSettings);

      await batch.commit();
    } catch (err) {
      console.error('Firestore resetDemoData failed:', err);
      throw err;
    }
  }

  async exportBackup(): Promise<string> {
    await this.initialize();
    const categories = await this.getCategories(true);
    const subcategories = await this.getSubcategories(undefined, true);
    const products = await this.getProducts({ includeHidden: true });
    const homepageSettings = await this.getHomepageSettings();
    const storeSettings = await this.getStoreSettings();

    const backup: StorageDataBackup = {
      version: '2.0.0-firestore',
      timestamp: new Date().toISOString(),
      categories,
      subcategories,
      products,
      homepageSettings,
      storeSettings,
    };

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(backupJson: string): Promise<boolean> {
    try {
      const data = JSON.parse(backupJson);
      if (!data.categories || !data.subcategories || !data.products) {
        return false;
      }

      if (isFirebaseConfigured && db) {
        const batch = writeBatch(db);

        for (const cat of data.categories) {
          batch.set(doc(db, 'categories', cat.id), cat);
        }
        for (const sub of data.subcategories) {
          batch.set(doc(db, 'subcategories', sub.id), sub);
        }
        for (const prod of data.products) {
          batch.set(doc(db, 'products', prod.id), prod);
        }
        if (data.storeSettings) {
          batch.set(doc(db, 'settings', 'store_settings'), data.storeSettings);
        }
        if (data.homepageSettings) {
          batch.set(doc(db, 'settings', 'homepage'), data.homepageSettings);
        }

        await batch.commit();
        return true;
      }

      return LocalStorageService.importBackup(backupJson);
    } catch (e) {
      console.error('Firestore importBackup failed:', e);
      return false;
    }
  }

  getStorageMetrics(): { usedBytes: number; usedFormatted: string; percentEstimate: number } {
    return getLocalStorageUsage();
  }

  // ================= CATEGORIES =================

  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    await this.initialize();

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        let list: Category[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Category);
        });

        if (!includeInactive) {
          list = list.filter((c) => c.isActive);
        }

        return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      } catch (err) {
        console.warn('Firestore getCategories error:', err);
      }
    }

    return LocalStorageService.getCategories(includeInactive);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'categories', id));
        if (snap.exists()) {
          return snap.data() as Category;
        }
        return null;
      } catch (err) {
        console.warn('Firestore getCategoryById error:', err);
      }
    }

    return LocalStorageService.getCategoryById(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const list = await this.getCategories(true);
    return list.find((c) => c.slug === slug.toLowerCase()) || null;
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const newCategory: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      slug: slugify(data.slug || data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'categories', newCategory.id), newCategory);
      return newCategory;
    }

    return LocalStorageService.createCategory(data);
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const existing = await this.getCategoryById(id);
    if (!existing) throw new Error(`Category ${id} not found`);

    const updated: Category = {
      ...existing,
      ...data,
      slug: data.slug ? slugify(data.slug) : existing.slug,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'categories', id), updated);
      return updated;
    }

    return LocalStorageService.updateCategory(id, data);
  }

  async deleteCategory(
    id: string
  ): Promise<{ success: boolean; subcategoriesDeleted: number; productsDeleted: number }> {
    const category = await this.getCategoryById(id);
    const subcategories = await this.getSubcategories(id, true);
    const products = await this.getProducts({ categoryId: id, includeHidden: true });

    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);

      // Delete category
      batch.delete(doc(db, 'categories', id));

      // Delete subcategories
      for (const sub of subcategories) {
        batch.delete(doc(db, 'subcategories', sub.id));
      }

      // Delete products
      for (const prod of products) {
        batch.delete(doc(db, 'products', prod.id));
      }

      await batch.commit();

      // Clean up associated Supabase media
      for (const prod of products) {
        await supabaseMediaService.deleteProductMedia(prod.id);
      }
      for (const sub of subcategories) {
        await supabaseMediaService.deleteSubcategoryMedia(sub.id, sub.coverImage);
      }
      await supabaseMediaService.deleteCategoryMedia(id, category?.coverImage);

      return {
        success: true,
        subcategoriesDeleted: subcategories.length,
        productsDeleted: products.length,
      };
    }

    return LocalStorageService.deleteCategory(id);
  }

  // ================= SUBCATEGORIES =================

  async getSubcategories(categoryId?: string, includeInactive: boolean = false): Promise<Subcategory[]> {
    await this.initialize();

    if (isFirebaseConfigured && db) {
      try {
        let snap;
        if (categoryId) {
          const q = query(collection(db, 'subcategories'), where('categoryId', '==', categoryId));
          snap = await getDocs(q);
        } else {
          snap = await getDocs(collection(db, 'subcategories'));
        }

        let list: Subcategory[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Subcategory);
        });

        if (!includeInactive) {
          list = list.filter((s) => s.isActive);
        }

        return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      } catch (err) {
        console.warn('Firestore getSubcategories error:', err);
      }
    }

    return LocalStorageService.getSubcategories(categoryId, includeInactive);
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'subcategories', id));
        if (snap.exists()) {
          return snap.data() as Subcategory;
        }
        return null;
      } catch (err) {
        console.warn('Firestore getSubcategoryById error:', err);
      }
    }

    return LocalStorageService.getSubcategoryById(id);
  }

  async getSubcategoryBySlug(categoryId: string, slug: string): Promise<Subcategory | null> {
    const list = await this.getSubcategories(categoryId, true);
    return list.find((s) => s.slug === slug.toLowerCase()) || null;
  }

  async createSubcategory(data: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subcategory> {
    const newSubcategory: Subcategory = {
      ...data,
      id: `sub-${Date.now()}`,
      slug: slugify(data.slug || data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'subcategories', newSubcategory.id), newSubcategory);
      return newSubcategory;
    }

    return LocalStorageService.createSubcategory(data);
  }

  async updateSubcategory(id: string, data: Partial<Subcategory>): Promise<Subcategory> {
    const existing = await this.getSubcategoryById(id);
    if (!existing) throw new Error(`Subcategory ${id} not found`);

    const updated: Subcategory = {
      ...existing,
      ...data,
      slug: data.slug ? slugify(data.slug) : existing.slug,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'subcategories', id), updated);
      return updated;
    }

    return LocalStorageService.updateSubcategory(id, data);
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; productsDeleted: number }> {
    const subcategory = await this.getSubcategoryById(id);
    const products = await this.getProducts({ subcategoryId: id, includeHidden: true });

    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'subcategories', id));

      for (const prod of products) {
        batch.delete(doc(db, 'products', prod.id));
      }

      await batch.commit();

      for (const prod of products) {
        await supabaseMediaService.deleteProductMedia(prod.id);
      }
      await supabaseMediaService.deleteSubcategoryMedia(id, subcategory?.coverImage);

      return {
        success: true,
        productsDeleted: products.length,
      };
    }

    return LocalStorageService.deleteSubcategory(id);
  }

  // ================= PRODUCTS =================

  async getProducts(filters?: {
    categoryId?: string;
    subcategoryId?: string;
    status?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isTrending?: boolean;
    searchQuery?: string;
    includeHidden?: boolean;
  }): Promise<Product[]> {
    await this.initialize();

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        let list: Product[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Product);
        });

        if (!filters?.includeHidden) {
          list = list.filter((p) => p.status !== 'HIDDEN' && p.status !== 'DRAFT');
        }

        if (filters?.categoryId) {
          list = list.filter((p) => p.categoryId === filters.categoryId);
        }
        if (filters?.subcategoryId) {
          list = list.filter((p) => p.subcategoryId === filters.subcategoryId);
        }
        if (filters?.status) {
          list = list.filter((p) => p.status === filters.status);
        }
        if (filters?.isFeatured !== undefined) {
          list = list.filter((p) => p.isFeatured === filters.isFeatured);
        }
        if (filters?.isNewArrival !== undefined) {
          list = list.filter((p) => p.isNewArrival === filters.isNewArrival);
        }
        if (filters?.isTrending !== undefined) {
          list = list.filter((p) => p.isTrending === filters.isTrending);
        }
        if (filters?.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          list = list.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q) ||
              p.description?.toLowerCase().includes(q) ||
              p.tags?.some((t) => t.toLowerCase().includes(q)) ||
              p.brand?.toLowerCase().includes(q) ||
              p.fabric?.toLowerCase().includes(q)
          );
        }

        return list;
      } catch (err) {
        console.warn('Firestore getProducts error:', err);
      }
    }

    return LocalStorageService.getProducts(filters);
  }

  async getProductById(id: string): Promise<Product | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          return snap.data() as Product;
        }
        return null;
      } catch (err) {
        console.warn('Firestore getProductById error:', err);
      }
    }

    return LocalStorageService.getProductById(id);
  }

  async getProductBySlug(
    categorySlug: string,
    subcategorySlug: string,
    productSlug: string
  ): Promise<Product | null> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return null;

    const subcategory = await this.getSubcategoryBySlug(category.id, subcategorySlug);
    if (!subcategory) return null;

    const list = await this.getProducts({
      categoryId: category.id,
      subcategoryId: subcategory.id,
      includeHidden: true,
    });

    return list.find((p) => p.slug === productSlug.toLowerCase()) || null;
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const category = await this.getCategoryById(data.categoryId);
    const subcategory = await this.getSubcategoryById(data.subcategoryId);

    const generatedId = generateProductId(category?.slug || 'CAT', subcategory?.slug || 'ITEM');
    const newProduct: Product = {
      ...data,
      id: generatedId,
      slug: slugify(data.slug || data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
      return newProduct;
    }

    return LocalStorageService.createProduct(data);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const existing = await this.getProductById(id);
    if (!existing) throw new Error(`Product ${id} not found`);

    const updated: Product = {
      ...existing,
      ...data,
      slug: data.slug ? slugify(data.slug) : existing.slug,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'products', id), updated);
      return updated;
    }

    return LocalStorageService.updateProduct(id, data);
  }

  async duplicateProduct(id: string): Promise<Product> {
    const original = await this.getProductById(id);
    if (!original) throw new Error(`Product ${id} not found`);

    const copyData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      ...original,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'DRAFT',
    };

    return this.createProduct(copyData);
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'products', id));
      await supabaseMediaService.deleteProductMedia(id);
      return true;
    }

    return LocalStorageService.deleteProduct(id);
  }

  // ================= CMS & SETTINGS =================

  async getHomepageSettings(): Promise<HomepageSettings> {
    await this.initialize();

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'homepage'));
        if (snap.exists()) {
          return snap.data() as HomepageSettings;
        }
      } catch (err) {
        console.warn('Firestore getHomepageSettings error:', err);
      }
    }

    return LocalStorageService.getHomepageSettings();
  }

  async updateHomepageSettings(settings: Partial<HomepageSettings>): Promise<HomepageSettings> {
    const current = await this.getHomepageSettings();
    const updated = { ...current, ...settings };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'settings', 'homepage'), updated);
      return updated;
    }

    return LocalStorageService.updateHomepageSettings(settings);
  }

  async getStoreSettings(): Promise<StoreSettings> {
    await this.initialize();

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'store_settings'));
        if (snap.exists()) {
          return snap.data() as StoreSettings;
        }
      } catch (err) {
        console.warn('Firestore getStoreSettings error:', err);
      }
    }

    return LocalStorageService.getStoreSettings();
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getStoreSettings();
    const updated = { ...current, ...settings };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'settings', 'store_settings'), updated);
      return updated;
    }

    return LocalStorageService.updateStoreSettings(settings);
  }
}

export const FirestoreStorageService = new FirestoreStorageServiceImpl();
