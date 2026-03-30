"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";

export function useAuthProvider() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  return {
    isLoaded,
    isLoading: !isLoaded,
    isAuthenticated: !!isSignedIn,
    user,
    signOut: () => signOut({ redirectUrl: "/" }),
  };
}
