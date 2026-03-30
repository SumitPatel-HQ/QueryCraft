import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Ensure Next.js correctly identifies the root for monorepos or nested projects
  // outputFileTracingRoot: path.resolve(__dirname, ".."),
  
  // Proxy API requests to backend
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
