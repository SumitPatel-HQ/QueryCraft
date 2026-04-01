"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white px-2">Settings</h1>
          <p className="text-[rgba(255,255,255,0.6)] px-2">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white px-2">Settings</h1>
        <p className="text-[rgba(255,255,255,0.6)] px-2">Manage your account settings and preferences.</p>
      </div>
      
      <div className="w-full max-w-4xl">
        <div className="border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
          
          <div className="flex items-start gap-6 mb-8">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-zinc-700 text-white text-xl">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">Name</label>
                <div className="text-white">{user.displayName || "Not provided"}</div>
              </div>
              
              <div>
                <label className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">Email</label>
                <div className="text-white">{user.email}</div>
              </div>
              
              <div>
                <label className="text-sm text-[rgba(255,255,255,0.6)] block mb-1">User ID</label>
                <div className="text-white font-mono text-sm">{user.uid}</div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-[rgba(255,255,255,0.1)]">
            <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-red-600/10 border-red-600/30 text-red-500 hover:bg-red-600/20 hover:border-red-600/50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
