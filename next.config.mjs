/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      pg: false,
      dns: false,
      "pg-native": false,
    };
    return config;
  },
  serverExternalPackages: [],
  reactStrictMode: false,
};

process.env.PORT = process.env.PORT || "5000";

export default nextConfig;
