import { IStorageService } from './IStorageService';
import { FirestoreStorageService } from './FirestoreStorageService';

// Active storage service: Firebase Firestore for database, with Supabase Storage for media
export const storageService: IStorageService = FirestoreStorageService;

export * from './IStorageService';
export { FirestoreStorageService } from './FirestoreStorageService';
export { LocalStorageService } from './LocalStorageService';
export { supabaseMediaService } from './SupabaseMediaService';
export { runInitialMigrationIfEmpty } from './migrationService';
