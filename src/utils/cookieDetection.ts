/**
 * Утилита для проверки доступности куков в браузере
 */

/**
 * Проверяет, разрешены ли куки в браузере
 */
export const areCookiesEnabled = (): boolean => {
  if (typeof document === "undefined") {
    // SSR, предполагаем, что куки доступны
    return true;
  }

  // Пробуем установить тестовую куку
  try {
    document.cookie = "cookieTest=1; SameSite=Lax; path=/";
    const result = document.cookie.indexOf("cookieTest=") !== -1;

    // Удаляем тестовую куку
    document.cookie =
      "cookieTest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; path=/";

    return result;
  } catch (e) {
    console.error("Ошибка при проверке куков:", e);
    return false;
  }
};

/**
 * Возвращает предпочтительный метод хранения
 * в зависимости от доступности куков
 */
export const getPreferredStorage = () => {
  const cookiesEnabled = areCookiesEnabled();

  // Если куки доступны, используем их, иначе localStorage
  return {
    cookiesAvailable: cookiesEnabled,
    preferCookies: cookiesEnabled,
  };
};
