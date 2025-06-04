export function getApiUrl(path: string): string {
  // Проверяем, что мы на сервере
  if (typeof window === "undefined") {
    if (path.startsWith("/api/")) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      if (baseUrl) {
        return `${baseUrl}${path}`;
      }

      return path;
    } else {
      return path;
    }
  }

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
