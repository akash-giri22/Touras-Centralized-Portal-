/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone build
  output: 'standalone',
  experimental: {},
};

module.exports = nextConfig;
