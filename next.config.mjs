/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare Pages does not run the default Next.js Image Optimization server.
    // Disable optimization so images are served directly.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};
export default nextConfig;
