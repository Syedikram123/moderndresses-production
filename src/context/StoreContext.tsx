import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Category, Subcategory, Product, HomepageSettings, StoreSettings } from '../types';
import { storageService } from '../services/storage';
import {
  getCachedCatalog,
  setCachedCatalog,
  hasCatalogChanged,
} from '../services/storage/catalogCache';

interface StoreContextType {
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  homepageSettings: HomepageSettings | null;
  storeSettings: StoreSettings | null;
  isLoading: boolean;
  isRevalidating?: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  storageMetrics: { usedBytes: number; usedFormatted: string; percentEstimate: number };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous cache read for instant <10ms initial render
  const cached = getCachedCatalog();

  const [categories, setCategories] = useState<Category[]>(() => cached?.categories || []);
  const [subcategories, setSubcategories] = useState<Subcategory[]>(() => cached?.subcategories || []);
  const [products, setProducts] = useState<Product[]>(() => cached?.products || []);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(
    () => cached?.homepageSettings || null
  );
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    () => cached?.storeSettings || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !cached || cached.categories.length === 0);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [storageMetrics, setStorageMetrics] = useState({ usedBytes: 0, usedFormatted: '0 KB', percentEstimate: 0 });

  // Prevent duplicate concurrent in-flight Firestore requests
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  const loadAll = useCallback(async (): Promise<void> => {
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const fetchTask = (async () => {
      const isFirstLoadWithoutCache = !getCachedCatalog();
      if (isFirstLoadWithoutCache) {
        setIsLoading(true);
      } else {
        setIsRevalidating(true);
      }

      console.time('catalog-load');
      try {
        await storageService.initialize();

        // Single parallel query batch - NO sequential waiting
        const [cats, subcats, prods, hp, st] = await Promise.all([
          storageService.getCategories(true),
          storageService.getSubcategories(undefined, true),
          storageService.getProducts({ includeHidden: true }),
          storageService.getHomepageSettings(),
          storageService.getStoreSettings(),
        ]);

        const freshData = {
          categories: cats,
          subcategories: subcats,
          products: prods,
          homepageSettings: hp,
          storeSettings: st,
        };

        const currentCached = getCachedCatalog();

        // Update state and cache if first load or if Firestore data has changed
        if (!currentCached || hasCatalogChanged(currentCached, freshData)) {
          setCategories(cats);
          setSubcategories(subcats);
          setProducts(prods);
          setHomepageSettings(hp);
          setStoreSettings(st);
          setCachedCatalog(freshData);
        }

        setStorageMetrics(storageService.getStorageMetrics());
        setError(null);
      } catch (err: any) {
        console.error('Error loading store data from Firestore:', err);
        // If we already have cached data, don't break the UI with error
        if (!getCachedCatalog()) {
          setError('Failed to load store data');
        }
      } finally {
        console.timeEnd('catalog-load');
        setIsLoading(false);
        setIsRevalidating(false);
        inFlightPromiseRef.current = null;
      }
    })();

    inFlightPromiseRef.current = fetchTask;
    return fetchTask;
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const [hp, st] = await Promise.all([
        storageService.getHomepageSettings(),
        storageService.getStoreSettings(),
      ]);
      setHomepageSettings(hp);
      setStoreSettings(st);

      // Update cache
      const curCache = getCachedCatalog();
      if (curCache) {
        setCachedCatalog({
          ...curCache,
          homepageSettings: hp,
          storeSettings: st,
        });
      }

      setStorageMetrics(storageService.getStorageMetrics());
    } catch (err) {
      console.error('Error refreshing settings:', err);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <StoreContext.Provider
      value={{
        categories,
        subcategories,
        products,
        homepageSettings,
        storeSettings,
        isLoading,
        isRevalidating,
        error,
        refreshData: loadAll,
        refreshSettings,
        storageMetrics,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
