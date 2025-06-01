import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      use: "html-loader",
      include: /node_modules\/@mapbox\/node-pre-gyp/,
    });

    // Игнорируем проблемные файлы
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

export default nextConfig;
