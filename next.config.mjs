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
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    // Используем текущий домен из сервера как API URL
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  },
  // Добавляем настройки для API запросов на сервере
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:5000", "only-pc.ru"],
    },
  },
};

// Определяем порт для запуска приложения из переменной окружения
// Если порт 5000 занят, можно использовать другой порт
process.env.PORT = process.env.PORT || "5000";

export default nextConfig;
