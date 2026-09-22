import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword as updateFirebaseAuthPassword,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '../utils/authSecurity';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  adminEmail: string | null;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  recoverPassword: (recoverySecret: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'md_admin_auth_session';
const ADMIN_INTERNAL_EMAIL = 'admin@moderndresses.com';

// Deterministic initial credentials
// Initial Admin Password: moderndresses@admin2026
const DEFAULT_INITIAL_SALT = 'bc36ce213b2759abc69c738a68685705';
const DEFAULT_INITIAL_HASH = 'bb7affd4c4095e9c57a92caf64eb22941964e8fad4e75e4971cced38bde1684f';

// Initial Recovery Password: moderndresses@recovery2026
const DEFAULT_INITIAL_REC_SALT = 'c05603b589370c5eaa7fab644e08ded8';
const DEFAULT_INITIAL_REC_HASH = 'ce145f0a6be0540ac9afb6e94a99aecdee7521c8c2659bfe15339bdb8f752da2';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });
  const adminEmail = ADMIN_INTERNAL_EMAIL;

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  /**
   * Password login:
   * Authenticates against Firebase Auth using ADMIN_INTERNAL_EMAIL.
   * If the admin user does not yet exist in Firebase Auth and the entered password
   * matches the initial admin password (or configured hash), it automatically provisions
   * the account in Firebase Auth.
   */
  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!password) {
      return { success: false, error: 'Please enter your admin password.' };
    }

    if (isFirebaseConfigured && auth) {
      try {
        // 1. Attempt standard Firebase Auth sign in
        const cred = await signInWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, password);
        if (cred.user) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_STORAGE_KEY, 'true');
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Firebase Auth sign in attempt result:', err.code, err.message);

        // A. Check if Email/Password provider is disabled in Firebase Console
        if (err.code === 'auth/operation-not-allowed') {
          return {
            success: false,
            error:
              'Email/Password sign-in provider is disabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method, click "Email/Password", and toggle "Enable".',
          };
        }

        // B. Handle uninitialized user / invalid credentials
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-login-credentials'
        ) {
          // Verify if password matches the configured initial admin password
          const isInitialValid = await verifyPassword(password, DEFAULT_INITIAL_SALT, DEFAULT_INITIAL_HASH);

          if (isInitialValid) {
            try {
              // Automatically initialize and register the admin in Firebase Authentication
              const newCred = await createUserWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, password);
              if (newCred.user) {
                setIsAuthenticated(true);
                localStorage.setItem(AUTH_STORAGE_KEY, 'true');
                return { success: true };
              }
            } catch (createErr: any) {
              console.warn('Firebase Auth user creation error:', createErr.code, createErr.message);
              if (createErr.code === 'auth/operation-not-allowed') {
                return {
                  success: false,
                  error:
                    'Email/Password sign-in provider is disabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method, click "Email/Password", and toggle "Enable".',
                };
              }
              if (createErr.code === 'auth/email-already-in-use') {
                // User already created in Firebase with a different password
                return {
                  success: false,
                  error: 'Incorrect admin password. If you updated your password, please enter your new password.',
                };
              }
              return {
                success: false,
                error: createErr.message || 'Failed to initialize admin account in Firebase Authentication.',
              };
            }
          }

          return {
            success: false,
            error: 'Incorrect password. Please check and try again.',
          };
        }

        // C. Rate-limiting
        if (err.code === 'auth/too-many-requests') {
          return {
            success: false,
            error:
              'Account temporarily locked due to multiple failed attempts. Please wait a few minutes or reset your password using Forgot Password.',
          };
        }

        return {
          success: false,
          error: err.message || 'Incorrect password. Please check and try again.',
        };
      }
    }

    // Fallback if offline / local demo mode
    const isInitialValid = await verifyPassword(password, DEFAULT_INITIAL_SALT, DEFAULT_INITIAL_HASH);
    if (isInitialValid) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return { success: true };
    }

    return { success: false, error: 'Incorrect password.' };
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  /**
   * Change Password:
   * Updates password directly in Firebase Authentication and stores salted hash in Firestore
   */
  const changePassword = async (
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const strength = validatePasswordStrength(newPass);
    if (!strength.isValid) {
      return { success: false, error: strength.message };
    }

    if (isFirebaseConfigured && auth && auth.currentUser) {
      try {
        // Re-authenticate first to verify old password
        await signInWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, oldPass);

        // Update password in Firebase Auth
        await updateFirebaseAuthPassword(auth.currentUser, newPass);

        // Also update settings/admin_auth metadata in Firestore
        if (db) {
          const newSalt = generateSalt(16);
          const newHash = await hashPassword(newPass, newSalt);
          await setDoc(
            doc(db, 'settings', 'admin_auth'),
            {
              passwordHash: newHash,
              salt: newSalt,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }

        return { success: true };
      } catch (err: any) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          return { success: false, error: 'Current password is incorrect.' };
        }
        return { success: false, error: err?.message || 'Failed to update password.' };
      }
    }

    return { success: true };
  };

  /**
   * Password Recovery:
   * Verifies hashed recovery secret and resets admin password
   */
  const recoverPassword = async (
    recoverySecret: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!recoverySecret) {
      return { success: false, error: 'Recovery password is required.' };
    }

    const strength = validatePasswordStrength(newPass);
    if (!strength.isValid) {
      return { success: false, error: strength.message };
    }

    try {
      const isValid = await verifyPassword(recoverySecret, DEFAULT_INITIAL_REC_SALT, DEFAULT_INITIAL_REC_HASH);
      if (!isValid) {
        return { success: false, error: 'Incorrect recovery password.' };
      }

      // Recovery verified: update password in Firebase Auth
      if (isFirebaseConfigured && auth) {
        if (auth.currentUser) {
          await updateFirebaseAuthPassword(auth.currentUser, newPass);
        } else {
          try {
            await signInWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, newPass);
          } catch {
            try {
              await createUserWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, newPass);
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                // If user exists, sign in with initial password to update
                try {
                  const initialCred = await signInWithEmailAndPassword(
                    auth,
                    ADMIN_INTERNAL_EMAIL,
                    'moderndresses@admin2026'
                  );
                  if (initialCred.user) {
                    await updateFirebaseAuthPassword(initialCred.user, newPass);
                  }
                } catch {
                  return {
                    success: false,
                    error:
                      'Recovery secret matched. Please update password in Firebase Console (Authentication > Users) or sign in with your current password.',
                  };
                }
              }
            }
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password recovery failed.' };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        adminEmail,
        changePassword,
        recoverPassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

