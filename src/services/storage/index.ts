import { IStorageService } from './IStorageService';
import { FirestoreStorageService } from './FirestoreStorageService';

// Active storage service: Firebase Firestore for database, with Cloudinary for media
export const storageService: IStorageService = FirestoreStorageService;

export * from './IStorageService';
export { FirestoreStorageService } from './FirestoreStorageService';
export { LocalStorageService } from './LocalStorageService';
export { cloudinaryMediaService } from './CloudinaryMediaService';
export { runInitialMigrationIfEmpty } from './migrationService';
export * from './catalogCache';

