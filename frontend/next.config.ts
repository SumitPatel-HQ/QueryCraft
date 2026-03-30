import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [],
  },
  // Ensure Next.js correctly identifies the root for monorepos or nested projects
  // outputFileTracingRoot: path.resolve(__dirname, ".."),
};

export default nextConfig;
