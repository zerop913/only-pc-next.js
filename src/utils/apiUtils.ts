export function getApiUrl(path: string): string {
  // Проверяем, что мы на сервере
  if (typeof window === "undefined") {
    // На сервере всегда используем абсолютный URL для API запросов
    if (path.startsWith("/api/")) {
      // Получаем домен из переменных окружения
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (baseUrl) {
        console.log(`[apiUtils] Server-side API call: ${baseUrl}${path}`);
        return `${baseUrl}${path}`;
      } else {
        // Fallback на localhost для разработки
        console.warn(
          "[apiUtils] NEXT_PUBLIC_API_BASE_URL not set, using localhost"
        );
        return `http://localhost:3000${path}`;
      }
    }
    return path;
  }

  // В браузере используем относительные пути
  console.log(`[apiUtils] Client-side API call: ${path}`);
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
      credentials: "include",
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
