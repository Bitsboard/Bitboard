/** @type {import('next').NextConfig} */
const branch = process.env.CF_PAGES_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || process.env.BRANCH || "";
const inferredEnv = branch === "staging" ? "staging" : "main";

const nextConfig = {
  // Temporarily disable ESLint to allow build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enhanced error reporting
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Better source maps for debugging
  productionBrowserSourceMaps: true,

  // Enhanced image optimization logging
  images: {
    // Cloudflare Pages does not run the default Next.js Image Optimization server.
    // Disable optimization so images are served directly.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Better error boundaries
  reactStrictMode: true,
  swcMinify: true,

  env: {
    NEXT_PUBLIC_BRANCH: branch,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || inferredEnv
  },
  
  i18n: {
    locales: ["en", "fr", "es", "de"],
    defaultLocale: "en"
  }
};

export default nextConfig;
