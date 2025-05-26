"use client";

import { useState, useEffect } from "react";

/**
 * Хук, который помогает избежать лишних перезагрузок страниц
 * Сохраняет указанное состояние в сессии браузера
 */
export function usePageReload<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Используем sessionStorage вместо localStorage для временного хранения
  // SessionStorage сохраняется только на текущую сессию браузера
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Ошибка получения данных из sessionStorage:", error);
      return initialValue;
    }
  });

  // Сохраняем состояние в sessionStorage при каждом изменении
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Ошибка сохранения данных в sessionStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Хук для отслеживания активности страницы и предотвращения ненужных перезагрузок
 */
export function usePageVisibilityOptimization() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastVisibilityChange, setLastVisibilityChange] = useState(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      setIsVisible(document.visibilityState === "visible");
      setLastVisibilityChange(now);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { isVisible, lastVisibilityChange };
}
