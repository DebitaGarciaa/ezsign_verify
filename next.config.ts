import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.109.162:3000"],
    },
  },
  // Bagian rewrites ini sangat penting untuk menembus CORS API
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://devapi.mesign.id/api/:path*',
      },
    ];
  },
};

export default nextConfig;