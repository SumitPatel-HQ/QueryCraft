"use client";

/**
 * Firebase Authentication Provider
 * Provides auth context with Firebase user state and token management
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  uid: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser((previousUser) => {
        // Clear local state when auth identity changes.
        if (firebaseUser?.uid !== previousUser?.uid) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("databases");
            localStorage.removeItem("queries");
            localStorage.removeItem("chat_history");
            localStorage.removeItem("active_session");
          }
        }

        return firebaseUser;
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      // Clear all state on sign out
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  const getToken = async (forceRefresh = true): Promise<string | null> => {
    if (!auth) {
      console.warn("Auth token requested but Firebase Auth is not initialized.");
      return null;
    }
    const activeUser = auth.currentUser ?? user;
    if (!activeUser) return null;

    try {
      const token = await activeUser.getIdToken(forceRefresh);
      return token;
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    uid: user?.uid || null,
    loading,
    signIn: handleSignIn,
    signInWithGoogle: handleSignIn,
    signOut: handleSignOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
