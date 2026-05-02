/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["yogamdeal.tridotstech.com"],
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/search-api/:path*',
          destination: 'https://search.ihgind.com/:path*',
        },
      ],
      // afterFiles: runs AFTER Next.js file-system routes (including pages/api/*).
      // So /api/erp/* is handled by our cookie-forwarding proxy first.
      // This catch-all only fires for /api/* paths that have NO matching Next.js API route.
      afterFiles: [
        // {
        //   source: '/api/:path*',
        //   destination: 'http://167.71.204.41/api/:path*',
        // },
      ],
      fallback: [
      ],
    };
  },
};

export default nextConfig;
