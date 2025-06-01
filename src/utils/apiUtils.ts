/**
 * Утилиты для работы с API
 */

/**
 * Получает полный URL для API-запроса
 * В браузере возвращает относительный URL, на сервере - абсолютный
 */
export function getApiUrl(path: string): string {
  // Проверяем, что мы на сервере
  if (typeof window === "undefined") {
    // На сервере используем абсолютный URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}${path}`;
  }

  // В браузере используем относительный URL
  return path;
}

/**
 * Обертка для fetch с автоматическим определением URL
 */
export async function fetchApi(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, options);
}
