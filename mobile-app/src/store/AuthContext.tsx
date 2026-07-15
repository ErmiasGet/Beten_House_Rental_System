import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, isConfigured } from '../config/firebase';
import * as Storage from '../utils/storage';
import { authAPI, setOnUnauthorizedLogout } from '../services/api';

let onAuthStateChanged: any;
let signInWithEmailAndPassword: any;
let createUserWithEmailAndPassword: any;
let signOutFirebase: any;
let sendPasswordResetEmail: any;

if (isConfigured) {
  const firebaseAuth = require('firebase/auth');
  onAuthStateChanged = firebaseAuth.onAuthStateChanged;
  signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
  createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
  signOutFirebase = firebaseAuth.signOut;
  sendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOnUnauthorizedLogout(() => {
      setUser(null);
      setToken(null);
    });

    if (!isConfigured) {
      (async () => {
        try {
          await Storage.deleteItemAsync('token');
          await Storage.deleteItemAsync('user');
        } catch (error) {
          console.error('Failed to clear auth data:', error);
        } finally {
          setIsLoading(false);
        }
      })();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          const response = await authAPI.syncFirebaseUser({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || '',
          });
          const { user: userData, token: backendToken } = response.data.data;
          setUser(userData);
          setToken(backendToken);
          await Storage.setItemAsync('token', backendToken);
          await Storage.setItemAsync('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to sync Firebase user:', error);
          await signOutFirebase(auth);
          setUser(null);
          setToken(null);
          await Storage.deleteItemAsync('token');
          await Storage.deleteItemAsync('user');
        }
      } else {
        setUser(null);
        setToken(null);
        await Storage.deleteItemAsync('token');
        await Storage.deleteItemAsync('user');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (isConfigured) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const response = await authAPI.login({ email, password });
      const { user: userData, token: newToken } = response.data.data;
      setUser(userData);
      setToken(newToken);
    }
  };

  const register = async (email: string, password: string, fullName: string, phone: string) => {
    if (isConfigured) {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    await authAPI.register({ email, password, fullName, phone });
  };

  const logout = async () => {
    if (isConfigured && auth?.currentUser) {
      await signOutFirebase(auth);
    }
    setUser(null);
    setToken(null);
  };

  const forgotPassword = async (email: string) => {
    if (isConfigured) {
      await sendPasswordResetEmail(auth, email);
    } else {
      await authAPI.forgotPassword(email);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
