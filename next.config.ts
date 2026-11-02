import type { NextConfig } from "next";

const isMobileExport = process.env.NEXT_OUTPUT_EXPORT === "true";

const nextConfig: NextConfig = {
  distDir: process.env.HRMS_NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  ...(isMobileExport
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  images: {
    ...(isMobileExport ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.facebook.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  ...(isMobileExport
    ? {}
    : {
        async rewrites() {
          const rewrites = [
            {
              source: "/sitemap.xml",
              destination: "/api/sitemap",
            },
            {
              source: "/robots.txt",
              destination: "/api/robots",
            },
          ];

          return rewrites;
        },
      }),
};

export default nextConfig;
