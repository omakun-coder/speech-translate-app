/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,  // ← これが重要！！
  },
};

module.exports = nextConfig;
