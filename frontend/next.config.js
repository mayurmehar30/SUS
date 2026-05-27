/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://3.7.177.41/api";
const BACKEND_ORIGIN = API_URL.replace(/\/api$/, "");

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  images: {
    domains: ["localhost", "3.7.177.41"],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
