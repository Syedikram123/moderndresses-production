import { Category, Subcategory, Product, HomepageSettings, StoreSettings } from '../../types';

export interface CachedCatalog {
  version: number;
  timestamp: number;
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  homepageSettings: HomepageSettings | null;
  storeSettings: StoreSettings | null;
}

export const CATALOG_CACHE_KEY = 'md_public_catalog_cache_v2';
export const CATALOG_CACHE_VERSION = 2;

/**
 * Reads cached catalog synchronously from localStorage for instant 0ms initial render.
 */
export function getCachedCatalog(): CachedCatalog | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;

    const parsed: CachedCatalog = JSON.parse(raw);
    if (
      parsed &&
      parsed.version === CATALOG_CACHE_VERSION &&
      Array.isArray(parsed.categories) &&
      Array.isArray(parsed.products) &&
      parsed.homepageSettings
    ) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read catalog cache from localStorage:', err);
  }
  return null;
}

/**
 * Saves current authoritative catalog to client cache for next instant load.
 */
export function setCachedCatalog(data: {
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  homepageSettings: HomepageSettings | null;
  storeSettings: StoreSettings | null;
}): void {
  try {
    const cacheData: CachedCatalog = {
      version: CATALOG_CACHE_VERSION,
      timestamp: Date.now(),
      categories: data.categories,
      subcategories: data.subcategories,
      products: data.products,
      homepageSettings: data.homepageSettings,
      storeSettings: data.storeSettings,
    };
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.warn('Failed to write catalog cache to localStorage:', err);
  }
}

/**
 * Fast comparison to detect if newly fetched Firestore data differs from current state.
 */
export function hasCatalogChanged(
  current: {
    categories: Category[];
    subcategories: Subcategory[];
    products: Product[];
    homepageSettings: HomepageSettings | null;
    storeSettings: StoreSettings | null;
  },
  fresh: {
    categories: Category[];
    subcategories: Subcategory[];
    products: Product[];
    homepageSettings: HomepageSettings | null;
    storeSettings: StoreSettings | null;
  }
): boolean {
  if (
    current.categories.length !== fresh.categories.length ||
    current.subcategories.length !== fresh.subcategories.length ||
    current.products.length !== fresh.products.length
  ) {
    return true;
  }

  // Quick JSON comparison
  return JSON.stringify(current) !== JSON.stringify(fresh);
}

/**
 * Clears cached catalog
 */
export function clearCachedCatalog(): void {
  try {
    localStorage.removeItem(CATALOG_CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear catalog cache:', e);
  }
}
