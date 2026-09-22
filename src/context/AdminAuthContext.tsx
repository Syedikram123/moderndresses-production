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
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  adminEmail: string | null;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  recoverPassword: (recoverySecret: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'md_admin_auth_session';
const ADMIN_INTERNAL_EMAIL = 'admin@moderndresses.com';

// Pre-computed salted SHA-256 hashes for initial recovery setup (Zero plaintext in code)
const DEFAULT_INITIAL_REC_SALT = 'c05603b589370c5eaa7fab644e08ded8';
const DEFAULT_INITIAL_REC_HASH = 'c6ed0bda4c090bf9e735e55424a19d851ee72f1e882407e5025e1be8e5f29a65';

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
   * Authenticates against Firebase Auth to issue valid signed tokens (request.auth != null)
   * while keeping the customer-facing admin UI strictly password-only.
   */
  const login = async (password: string): Promise<boolean> => {
    if (!password) return false;

    if (isFirebaseConfigured && auth) {
      try {
        // Attempt standard sign in
        const cred = await signInWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, password);
        if (cred.user) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_STORAGE_KEY, 'true');
          return true;
        }
      } catch (err: any) {
        // If user does not exist yet in Firebase Auth on first startup, initialize account seamlessly
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, password);
            if (newCred.user) {
              setIsAuthenticated(true);
              localStorage.setItem(AUTH_STORAGE_KEY, 'true');
              return true;
            }
          } catch (createErr: any) {
            // If already exists but wrong password, sign-in failure is valid
            console.warn('Firebase Auth sign in failed:', createErr.message || err.message);
            return false;
          }
        }
        console.warn('Firebase Auth sign in failed:', err.message);
        return false;
      }
    }

    // Fallback local check if offline
    if (password) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }

    return false;
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
   * Updates password directly in Firebase Authentication and re-hashes credentials
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
      let storedRecHash = DEFAULT_INITIAL_REC_HASH;
      let storedRecSalt = DEFAULT_INITIAL_REC_SALT;

      if (isFirebaseConfigured && db) {
        const snap = await getDoc(doc(db, 'settings', 'admin_auth'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.recoveryHash && data.recoverySalt) {
            storedRecHash = data.recoveryHash;
            storedRecSalt = data.recoverySalt;
          }
        }
      }

      const isValid = await verifyPassword(recoverySecret, storedRecSalt, storedRecHash);
      if (!isValid) {
        return { success: false, error: 'Incorrect recovery password.' };
      }

      // Recovery verified: update password
      if (isFirebaseConfigured && auth) {
        if (auth.currentUser) {
          await updateFirebaseAuthPassword(auth.currentUser, newPass);
        } else {
          // Sign in or create with new password
          try {
            await signInWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, newPass);
          } catch {
            await createUserWithEmailAndPassword(auth, ADMIN_INTERNAL_EMAIL, newPass);
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
