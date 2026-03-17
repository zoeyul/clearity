/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@clearity/ui", "@clearity/lib"],
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
