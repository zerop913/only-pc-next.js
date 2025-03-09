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
  server: {
    port: 5000,
  },
  reactStrictMode: false,
};

export default nextConfig;
