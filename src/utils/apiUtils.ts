/**
 * Утилита для формирования абсолютных URL для API-запросов
 */

// Определяем базовый URL для API в зависимости от окружения
export const getBaseUrl = () => {
  // Используем переменную окружения на стороне сервера, если она доступна
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // В браузере используем текущий хост
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // В среде разработки на сервере
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:5000";
};

/**
 * Формирует абсолютный URL для API-запроса
 * @param path - Относительный путь API (например, '/api/products')
 * @returns Полный URL для API-запроса
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  // Убеждаемся, что путь начинается с /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Централизованная функция для выполнения API-запросов с правильными URL
 * @param path - Относительный путь API
 * @param options - Опции запроса fetch
 * @returns Promise с результатом запроса
 */
export const fetchApi = async (path: string, options?: RequestInit) => {
  const url = getApiUrl(path);
  return fetch(url, options);
};
