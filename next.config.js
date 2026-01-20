/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment - set this to your repo name
  basePath: process.env.NODE_ENV === 'production' ? '/asset-tracking-claude' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/asset-tracking-claude/' : '',
};

module.exports = nextConfig;
