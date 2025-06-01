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
 * Обертка для fetch с автоматическим определением URL и обработкой ошибок
 */
export async function fetchApi(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = getApiUrl(path);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    return response;
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
}
