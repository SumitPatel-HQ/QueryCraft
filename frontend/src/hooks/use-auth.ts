"use client";

import { useAuthContext } from "@/components/providers/auth-provider";

export function useAuth() {
  const context = useAuthContext();

  return {
    isLoaded: !context.loading,
    isLoading: context.loading,
    isAuthenticated: !!context.user,
    user: context.user,
    signOut: context.signOut,
    signInWithGoogle: context.signInWithGoogle,
  };
}

// Legacy export for backward compatibility
export const useAuthProvider = useAuth;
