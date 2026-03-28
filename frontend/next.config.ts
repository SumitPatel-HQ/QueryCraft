import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Ensure Next.js correctly identifies the root for monorepos or nested projects
  // outputFileTracingRoot: path.resolve(__dirname, ".."),
};

export default nextConfig;
