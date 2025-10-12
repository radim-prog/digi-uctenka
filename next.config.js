/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['lh3.googleusercontent.com', 'drive.google.com'],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
