/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "openai"],
  },
  // Increase API body size limit from 1MB default to 10MB for file uploads
  // Note: On Vercel, the platform enforces a 4.5MB limit regardless of this setting
  bodyParser: {
    sizeLimit: '10mb',
  },
};

module.exports = nextConfig;
