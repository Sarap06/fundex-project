import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
