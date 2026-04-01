/**
 * Firebase client SDK initialization
 * Handles Firebase Auth configuration and Google Sign-In
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  Auth,
  User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "api key";

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

if (isConfigValid) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  authInstance = getAuth(app);
} else {
  // During build / prerendering, we log a warning instead of crashing
  console.warn(
    "Firebase: Missing or invalid API key. Auth is disabled. " +
    "If this is a production build, ensure NEXT_PUBLIC_FIREBASE_API_KEY is set."
  );
}

// Initialize Auth
export const auth = authInstance as Auth; // Keep type for now, but handle undefined in usages


// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Reuse a single popup request to prevent auth/cancelled-popup-request.
let activeGoogleSignIn: Promise<User> | null = null;

/**
 * Sign in with Google popup
 */
export const signInWithGoogle = async () => {
  if (activeGoogleSignIn) {
    return activeGoogleSignIn;
  }

  activeGoogleSignIn = (async () => {
    try {
      if (!auth) {
        throw new Error("Firebase Auth is not correctly configured.");
      }
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      // This can happen when another popup request interrupts the current one.
      if (
        error instanceof FirebaseError &&
        error.code === "auth/cancelled-popup-request"
      ) {
        throw error;
      }

      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      activeGoogleSignIn = null;
    }
  })();

  return await activeGoogleSignIn;
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  try {
    if (!auth) {
      console.warn("Sign-out attempted but Firebase Auth is not initialized.");
      return;
    }
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export default app;
