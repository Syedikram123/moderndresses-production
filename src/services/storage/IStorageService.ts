import {
  Category,
  Subcategory,
  Product,
  HomepageSettings,
  StoreSettings,
  StorageDataBackup
} from '../../types';

export interface IStorageService {
  // Initialization & System
  initialize(): Promise<void>;
  resetDemoData(): Promise<void>;
  exportBackup(): Promise<string>;
  importBackup(backupJson: string): Promise<boolean>;
  getStorageMetrics(): { usedBytes: number; usedFormatted: string; percentEstimate: number };

  // Categories
  getCategories(includeInactive?: boolean): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  updateCategory(id: string, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<{ success: boolean; subcategoriesDeleted: number; productsDeleted: number }>;

  // Subcategories
  getSubcategories(categoryId?: string, includeInactive?: boolean): Promise<Subcategory[]>;
  getSubcategoryById(id: string): Promise<Subcategory | null>;
  getSubcategoryBySlug(categoryId: string, slug: string): Promise<Subcategory | null>;
  createSubcategory(data: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subcategory>;
  updateSubcategory(id: string, data: Partial<Subcategory>): Promise<Subcategory>;
  deleteSubcategory(id: string): Promise<{ success: boolean; productsDeleted: number }>;

  // Products
  getProducts(filters?: {
    categoryId?: string;
    subcategoryId?: string;
    status?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isTrending?: boolean;
    searchQuery?: string;
    includeHidden?: boolean;
  }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductBySlug(categorySlug: string, subcategorySlug: string, productSlug: string): Promise<Product | null>;
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product>;
  duplicateProduct(id: string): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;

  // CMS & Settings
  getHomepageSettings(): Promise<HomepageSettings>;
  updateHomepageSettings(settings: Partial<HomepageSettings>): Promise<HomepageSettings>;
  getStoreSettings(): Promise<StoreSettings>;
  updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
}
