/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://3.7.177.41/api",
  },
  images: {
    domains: ["localhost", "3.7.177.41"],
  },
};
module.exports = nextConfig;
