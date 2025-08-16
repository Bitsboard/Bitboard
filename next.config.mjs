/** @type {import('next').NextConfig} */
const branch = process.env.CF_PAGES_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || process.env.BRANCH || "";
const inferredEnv = branch === "staging" ? "staging" : "main";

const nextConfig = {
  images: {
    // Cloudflare Pages does not run the default Next.js Image Optimization server.
    // Disable optimization so images are served directly.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  env: {
    NEXT_PUBLIC_BRANCH: branch,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || inferredEnv
  }
};
export default nextConfig;
