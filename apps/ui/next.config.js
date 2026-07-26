/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../..'),
  reactStrictMode: true,
};

module.exports = nextConfig;
