"use client";

import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-start gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white px-2">Settings</h1>
        <p className="text-[rgba(255,255,255,0.6)] px-2">Manage your account settings and preferences.</p>
      </div>
      
      <div className="w-full flex justify-center lg:justify-start">
        <UserProfile 
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full max-w-4xl",
              card: "shadow-none border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]",
              navbar: "border-r border-[rgba(255,255,255,0.1)]",
              headerTitle: "text-white",
              headerSubtitle: "text-[rgba(255,255,255,0.6)]",
              profileSectionTitleText: "text-white opacity-80",
              button: "text-white hover:bg-[rgba(255,255,255,0.1)]",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white transition-colors",
              userPreviewMainIdentifier: "text-white",
              userPreviewSecondaryIdentifier: "text-[rgba(255,255,255,0.6)]",
            },
            variables: {
              colorPrimary: "#3b82f6",
              colorText: "rgba(255,255,255,0.87)",
              colorBackground: "#1a1a1a",
              colorInputBackground: "#262626",
              colorInputText: "white",
              borderRadius: "0.5rem",
            }
          }}
        />
      </div>
    </div>
  );
}
