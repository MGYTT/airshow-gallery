import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85, 90, 95, 100],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 768],
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Picsum (placeholder)
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Wszystkie zewnętrzne domeny HTTPS (URL-e z internetu jako miniatury)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;