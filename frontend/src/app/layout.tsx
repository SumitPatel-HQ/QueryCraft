import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Toaster } from "@/components/ui/sonner";
import { RouteSyncer } from "@/components/route-syncer";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "SQL AI",
  description: "AI-powered SQL assistant",
  icons: {
    icon: "/logo2.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider ui={ui}>
      <html lang="en" className="dark">
        <body
          className={`${geist.variable} ${geistMono.variable} antialiased font-sans`}
        >
          {children}
          <RouteSyncer />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
