import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { LOCAL_STORAGE_SEED } from '../../data/localStorageSeed';
import { generateSalt, hashPassword } from '../../utils/authSecurity';

export interface MigrationResult {
  success: boolean;
  alreadyInitialized?: boolean;
  categoriesMigrated?: number;
  subcategoriesMigrated?: number;
  productsMigrated?: number;
  error?: string;
}

/**
 * Migration Service:
 * Automatically migrates the confirmed initial dataset from LOCAL_STORAGE_SEED
 * into Firebase Firestore on first run.
 * Idempotent: Never overwrites already-populated Firestore data.
 */
export async function runInitialMigrationIfEmpty(): Promise<MigrationResult> {
  if (!isFirebaseConfigured || !db) {
    return {
      success: false,
      error: 'Firebase is not configured in environment variables.',
    };
  }

  try {
    // 1. Check if store_settings document or categories already exist in Firestore
    const storeSettingsRef = doc(db, 'settings', 'store_settings');
    const storeSettingsSnap = await getDoc(storeSettingsRef);

    const categoriesRef = collection(db, 'categories');
    const categoriesSnap = await getDocs(categoriesRef);

    if (storeSettingsSnap.exists() && !categoriesSnap.empty) {
      // Data is already present. Do not overwrite!
      return {
        success: true,
        alreadyInitialized: true,
      };
    }

    console.log('Firestore is empty or uninitialized. Performing initial seed migration...');

    const batch = writeBatch(db);

    // 2. Migrate Categories
    let catCount = 0;
    for (const cat of LOCAL_STORAGE_SEED.categories) {
      const catDoc = doc(db, 'categories', cat.id);
      batch.set(catDoc, cat);
      catCount++;
    }

    // 3. Migrate Subcategories
    let subCount = 0;
    for (const sub of LOCAL_STORAGE_SEED.subcategories) {
      const subDoc = doc(db, 'subcategories', sub.id);
      batch.set(subDoc, sub);
      subCount++;
    }

    // 4. Migrate Products
    let prodCount = 0;
    for (const prod of LOCAL_STORAGE_SEED.products) {
      const prodDoc = doc(db, 'products', prod.id);
      batch.set(prodDoc, prod);
      prodCount++;
    }

    // 5. Migrate Settings
    batch.set(storeSettingsRef, LOCAL_STORAGE_SEED.storeSettings);

    const homepageRef = doc(db, 'settings', 'homepage');
    batch.set(homepageRef, LOCAL_STORAGE_SEED.homepageSettings);

    // 6. Initialize Admin Auth with secure salted SHA-256 hashes (No plaintext in source code)
    const adminAuthRef = doc(db, 'settings', 'admin_auth');
    const adminAuthSnap = await getDoc(adminAuthRef);
    if (!adminAuthSnap.exists()) {
      batch.set(adminAuthRef, {
        passwordHash: '970aa567adf10f8fd13265f79bd2c1d8547ce388a89261aa853375bc63547754',
        salt: 'bc36ce213b2759abc69c738a68685705',
        recoveryHash: 'c6ed0bda4c090bf9e735e55424a19d851ee72f1e882407e5025e1be8e5f29a65',
        recoverySalt: 'c05603b589370c5eaa7fab644e08ded8',
        updatedAt: new Date().toISOString(),
      });
    }

    // Commit batch
    await batch.commit();
    console.log(
      `Firestore migration completed successfully: ${catCount} categories, ${subCount} subcategories, ${prodCount} products.`
    );

    return {
      success: true,
      alreadyInitialized: false,
      categoriesMigrated: catCount,
      subcategoriesMigrated: subCount,
      productsMigrated: prodCount,
    };
  } catch (err: any) {
    console.error('Firestore migration failed:', err);
    return {
      success: false,
      error: err?.message || 'Migration failed',
    };
  }
}
