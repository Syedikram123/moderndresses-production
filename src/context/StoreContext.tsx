import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Category, Subcategory, Product, HomepageSettings, StoreSettings } from '../types';
import { storageService } from '../services/storage';

interface StoreContextType {
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  homepageSettings: HomepageSettings | null;
  storeSettings: StoreSettings | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  storageMetrics: { usedBytes: number; usedFormatted: string; percentEstimate: number };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMetrics, setStorageMetrics] = useState({ usedBytes: 0, usedFormatted: '0 KB', percentEstimate: 0 });

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      await storageService.initialize();

      const [cats, subcats, prods, hp, st] = await Promise.all([
        storageService.getCategories(true),
        storageService.getSubcategories(undefined, true),
        storageService.getProducts({ includeHidden: true }),
        storageService.getHomepageSettings(),
        storageService.getStoreSettings(),
      ]);

      setCategories(cats);
      setSubcategories(subcats);
      setProducts(prods);
      setHomepageSettings(hp);
      setStoreSettings(st);
      setStorageMetrics(storageService.getStorageMetrics());
      setError(null);
    } catch (err: any) {
      console.error('Error loading store data:', err);
      setError('Failed to load store data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const [hp, st] = await Promise.all([
        storageService.getHomepageSettings(),
        storageService.getStoreSettings(),
      ]);
      setHomepageSettings(hp);
      setStoreSettings(st);
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
