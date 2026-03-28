"use client";

import { useState } from "react";

export function useAuth() {
  const [isLoading] = useState(false);
  const [isAuthenticated] = useState(false);
  const [user] = useState(null);

  const signIn = async () => {
    // TODO: Implement authentication logic
    console.log("Sign in not implemented");
  };

  const signOut = async () => {
    // TODO: Implement sign out logic
    console.log("Sign out not implemented");
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}
