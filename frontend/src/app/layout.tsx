import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RouteSyncer } from "@/components/route-syncer";
import { AuthProvider } from "@/components/providers/auth-provider";
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
  title: {
    default: "QueryCraft | AI-Powered SQL Assistant",
    template: "%s | QueryCraft",
  },
  description:
    "Transform natural language into precise SQL queries. QueryCraft is the intelligent companion for database exploration, schema mapping, and data insights.",
  keywords: ["SQL", "AI", "Natural Language to SQL", "Database Assistant", "Schema Mapping", "Data Insights"],
  authors: [{ name: "QueryCraft Team" }],
  icons: {
    icon: "/logo2.png",
    apple: "/logo2.png",
  },
  openGraph: {
    title: "QueryCraft | AI-Powered SQL Assistant",
    description: "Transform natural language into precise SQL queries.",
    url: "https://querycraft.ai", // Replace with production URL
    siteName: "QueryCraft",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AuthProvider>
          {children}
          <RouteSyncer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
