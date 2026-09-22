import { IStorageService } from './IStorageService';
import {
  Category,
  Subcategory,
  Product,
  HomepageSettings,
  StoreSettings,
  StorageDataBackup,
} from '../../types';
import { LOCAL_STORAGE_SEED, LOCAL_STORAGE_KEYS as KEYS } from '../../data/localStorageSeed';
import { getLocalStorageUsage } from '../../utils/imageCompressor';
import { generateProductId, slugify } from '../../utils/formatters';

class LocalStorageServiceImpl implements IStorageService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Granular, non-destructive per-key initialization:
      // Only populates missing keys without overwriting any existing custom data
      if (!localStorage.getItem(KEYS.CATEGORIES)) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(LOCAL_STORAGE_SEED.categories));
      }
      if (!localStorage.getItem(KEYS.SUBCATEGORIES)) {
        localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(LOCAL_STORAGE_SEED.subcategories));
      }
      if (!localStorage.getItem(KEYS.PRODUCTS)) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(LOCAL_STORAGE_SEED.products));
      }
      if (!localStorage.getItem(KEYS.HOMEPAGE)) {
        localStorage.setItem(KEYS.HOMEPAGE, JSON.stringify(LOCAL_STORAGE_SEED.homepageSettings));
      }
      if (!localStorage.getItem(KEYS.SETTINGS)) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(LOCAL_STORAGE_SEED.storeSettings));
      }
      if (!localStorage.getItem(KEYS.INITIALIZED)) {
        localStorage.setItem(KEYS.INITIALIZED, 'true');
      }
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize LocalStorageService:', e);
    }
  }

  async resetDemoData(): Promise<void> {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(LOCAL_STORAGE_SEED.categories));
    localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(LOCAL_STORAGE_SEED.subcategories));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(LOCAL_STORAGE_SEED.products));
    localStorage.setItem(KEYS.HOMEPAGE, JSON.stringify(LOCAL_STORAGE_SEED.homepageSettings));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(LOCAL_STORAGE_SEED.storeSettings));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  }

  async exportBackup(): Promise<string> {
    await this.initialize();
    const backup: StorageDataBackup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      categories: JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]'),
      subcategories: JSON.parse(localStorage.getItem(KEYS.SUBCATEGORIES) || '[]'),
      products: JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]'),
      homepageSettings: JSON.parse(localStorage.getItem(KEYS.HOMEPAGE) || JSON.stringify(LOCAL_STORAGE_SEED.homepageSettings)),
      storeSettings: JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(LOCAL_STORAGE_SEED.storeSettings)),
    };
    return JSON.stringify(backup, null, 2);
  }

  async importBackup(backupJson: string): Promise<boolean> {
    try {
      const data = JSON.parse(backupJson) as StorageDataBackup;
      if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
        throw new Error('Invalid backup file format');
      }

      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data.categories));
      localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(data.subcategories || []));
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.homepageSettings) {
        localStorage.setItem(KEYS.HOMEPAGE, JSON.stringify(data.homepageSettings));
      }
      if (data.storeSettings) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.storeSettings));
      }
      localStorage.setItem(KEYS.INITIALIZED, 'true');
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }

  getStorageMetrics() {
    return getLocalStorageUsage();
  }

  // CATEGORIES
  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    await this.initialize();
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    let list: Category[] = [];
    try {
      list = raw ? JSON.parse(raw) : LOCAL_STORAGE_SEED.categories;
    } catch {
      list = LOCAL_STORAGE_SEED.categories;
    }
    const filtered = includeInactive ? list : list.filter((c) => c.isActive);
    return filtered.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const list = await this.getCategories(true);
    return list.find((c) => c.id === id) || null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const list = await this.getCategories(true);
    return list.find((c) => c.slug === slug.toLowerCase()) || null;
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const list = await this.getCategories(true);
    const newCategory: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      slug: slugify(data.slug || data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newCategory);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(list));
    return newCategory;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const list = await this.getCategories(true);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Category ${id} not found`);

    const updated: Category = {
      ...list[idx],
      ...data,
      slug: data.slug ? slugify(data.slug) : list[idx].slug,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(list));
    return updated;
  }

  async deleteCategory(id: string): Promise<{ success: boolean; subcategoriesDeleted: number; productsDeleted: number }> {
    const categories = await this.getCategories(true);
    const subcategories = await this.getSubcategories(undefined, true);
    const products = await this.getProducts({ includeHidden: true });

    const relatedSubcats = subcategories.filter((s) => s.categoryId === id);
    const relatedProducts = products.filter((p) => p.categoryId === id);

    const remainingCats = categories.filter((c) => c.id !== id);
    const remainingSubcats = subcategories.filter((s) => s.categoryId !== id);
    const remainingProducts = products.filter((p) => p.categoryId !== id);

    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(remainingCats));
    localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(remainingSubcats));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(remainingProducts));

    return {
      success: true,
      subcategoriesDeleted: relatedSubcats.length,
      productsDeleted: relatedProducts.length,
    };
  }

  // SUBCATEGORIES
  async getSubcategories(categoryId?: string, includeInactive: boolean = false): Promise<Subcategory[]> {
    await this.initialize();
    const raw = localStorage.getItem(KEYS.SUBCATEGORIES);
    let list: Subcategory[] = [];
    try {
      list = raw ? JSON.parse(raw) : LOCAL_STORAGE_SEED.subcategories;
    } catch {
      list = LOCAL_STORAGE_SEED.subcategories;
    }
    if (categoryId) {
      list = list.filter((s) => s.categoryId === categoryId);
    }
    if (!includeInactive) {
      list = list.filter((s) => s.isActive);
    }
    return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    const list = await this.getSubcategories(undefined, true);
    return list.find((s) => s.id === id) || null;
  }

  async getSubcategoryBySlug(categoryId: string, slug: string): Promise<Subcategory | null> {
    const list = await this.getSubcategories(categoryId, true);
    return list.find((s) => s.slug === slug.toLowerCase()) || null;
  }

  async createSubcategory(data: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subcategory> {
    const list = await this.getSubcategories(undefined, true);
    const newSubcategory: Subcategory = {
      ...data,
      id: `sub-${Date.now()}`,
      slug: slugify(data.slug || data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newSubcategory);
    localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(list));
    return newSubcategory;
  }

  async updateSubcategory(id: string, data: Partial<Subcategory>): Promise<Subcategory> {
    const list = await this.getSubcategories(undefined, true);
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Subcategory ${id} not found`);

    const updated: Subcategory = {
      ...list[idx],
      ...data,
      slug: data.slug ? slugify(data.slug) : list[idx].slug,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(list));
    return updated;
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; productsDeleted: number }> {
    const subcategories = await this.getSubcategories(undefined, true);
    const products = await this.getProducts({ includeHidden: true });

    const relatedProducts = products.filter((p) => p.subcategoryId === id);
    const remainingSubcats = subcategories.filter((s) => s.id !== id);
    const remainingProducts = products.filter((p) => p.subcategoryId !== id);

    localStorage.setItem(KEYS.SUBCATEGORIES, JSON.stringify(remainingSubcats));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(remainingProducts));

    return {
      success: true,
      productsDeleted: relatedProducts.length,
    };
  }

  // PRODUCTS
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
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    let list: Product[] = [];
    try {
      list = raw ? JSON.parse(raw) : LOCAL_STORAGE_SEED.products;
    } catch {
      list = LOCAL_STORAGE_SEED.products;
    }

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
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.brand?.toLowerCase().includes(q) ||
          p.fabric?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  async getProductById(id: string): Promise<Product | null> {
    const list = await this.getProducts({ includeHidden: true });
    return list.find((p) => p.id === id) || null;
  }

  async getProductBySlug(categorySlug: string, subcategorySlug: string, productSlug: string): Promise<Product | null> {
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
    const list = await this.getProducts({ includeHidden: true });
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

    list.push(newProduct);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const list = await this.getProducts({ includeHidden: true });
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product ${id} not found`);

    const updated: Product = {
      ...list[idx],
      ...data,
      slug: data.slug ? slugify(data.slug) : list[idx].slug,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    return updated;
  }

  async duplicateProduct(id: string): Promise<Product> {
    const original = await this.getProductById(id);
    if (!original) throw new Error(`Product ${id} not found`);

    const category = await this.getCategoryById(original.categoryId);
    const subcategory = await this.getSubcategoryById(original.subcategoryId);

    const newId = generateProductId(category?.slug || 'CAT', subcategory?.slug || 'ITEM');
    const duplicated: Product = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = await this.getProducts({ includeHidden: true });
    list.unshift(duplicated);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    return duplicated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const list = await this.getProducts({ includeHidden: true });
    const remaining = list.filter((p) => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(remaining));
    return true;
  }

  // CMS & SETTINGS
  async getHomepageSettings(): Promise<HomepageSettings> {
    await this.initialize();
    const raw = localStorage.getItem(KEYS.HOMEPAGE);
    try {
      return raw ? JSON.parse(raw) : LOCAL_STORAGE_SEED.homepageSettings;
    } catch {
      return LOCAL_STORAGE_SEED.homepageSettings;
    }
  }

  async updateHomepageSettings(settings: Partial<HomepageSettings>): Promise<HomepageSettings> {
    const current = await this.getHomepageSettings();
    const updated: HomepageSettings = {
      ...current,
      ...settings,
      sections: {
        ...current.sections,
        ...(settings.sections || {}),
      },
      hero: {
        ...current.hero,
        ...(settings.hero || {}),
      },
      promoBanner: {
        ...current.promoBanner,
        ...(settings.promoBanner || {}),
      },
      customSection: {
        ...current.customSection,
        ...(settings.customSection || {}),
      },
    };
    localStorage.setItem(KEYS.HOMEPAGE, JSON.stringify(updated));
    return updated;
  }

  async getStoreSettings(): Promise<StoreSettings> {
    await this.initialize();
    const raw = localStorage.getItem(KEYS.SETTINGS);
    try {
      return raw ? JSON.parse(raw) : LOCAL_STORAGE_SEED.storeSettings;
    } catch {
      return LOCAL_STORAGE_SEED.storeSettings;
    }
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getStoreSettings();
    const updated: StoreSettings = {
      ...current,
      ...settings,
    };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }
}

export const LocalStorageService = new LocalStorageServiceImpl();
