import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  cleanDistDir: true,
  images: {
    remotePatterns: [],
  },
  // Ensure Next.js correctly identifies the root for monorepos or nested projects
  // outputFileTracingRoot: path.resolve(__dirname, ".."),

  // Proxy API requests to backend
  async rewrites() {
    // In production Docker environments, the backend is reachable via the service name 'backend'
    const backendUrl = process.env.BACKEND_URL || "http://backend:8000";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
