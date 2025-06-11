export function getApiUrl(path: string): string {
  // Проверяем, что мы на сервере
  if (typeof window === "undefined") {
    // На сервере всегда используем абсолютный URL для API запросов
    if (path.startsWith("/api/")) {
      // Получаем домен из переменных окружения или используем локальный сервер для разработки
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      return `${baseUrl}${path}`;
    }
    return path;
  }

  // В браузере используем относительные пути
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
