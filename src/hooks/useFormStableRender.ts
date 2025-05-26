import { useState, useRef, useEffect, useCallback } from "react";
import { usePageVisibility } from "./usePageVisibility";

/**
 * Хук для оптимизации ререндеров форм при переключении вкладок
 * Использует RAF и другие методы оптимизации для предотвращения микро-мерцаний
 */
export function useFormStableRender() {
  const isPageVisible = usePageVisibility();
  const visibilityRef = useRef(isPageVisible);
  const pendingUpdatesRef = useRef<Map<string, any>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const fieldRafsRef = useRef<Map<string, number>>(new Map());

  // Обновляем реф при изменении видимости
  useEffect(() => {
    visibilityRef.current = isPageVisible;

    // Если страница стала видимой и есть отложенные обновления - применяем их
    if (isPageVisible && pendingUpdatesRef.current.size > 0) {
      // Отменяем предыдущий RAF, если он был
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Запланируем обработку на следующий кадр
      rafIdRef.current = requestAnimationFrame(() => {
        const callbacks: Array<() => void> = [];

        // Собираем все колбэки для выполнения
        pendingUpdatesRef.current.forEach((callback, key) => {
          if (typeof callback === "function") {
            callbacks.push(callback);
          }
        });

        // Очищаем очередь
        pendingUpdatesRef.current.clear();

        // Выполняем колбэки после очистки
        callbacks.forEach((callback) => callback());
      });
    }
  }, [isPageVisible]);

  /**
   * Регистрирует обновление поля формы с оптимизацией ререндера
   * @param fieldName Имя поля формы
   * @param updateFn Функция обновления (будет вызвана при восстановлении видимости)
   * @param immediate Если true - обновление будет применено сразу, иначе будет запланировано
   */
  const registerFieldUpdate = useCallback(
    (fieldName: string, updateFn: () => void, immediate = false) => {
      // Отменяем предыдущий RAF для этого поля, если он был
      if (fieldRafsRef.current.has(fieldName)) {
        cancelAnimationFrame(fieldRafsRef.current.get(fieldName)!);
      }

      // Если страница видима или требуется немедленное обновление, используем RAF
      if (visibilityRef.current || immediate) {
        const rafId = requestAnimationFrame(() => {
          fieldRafsRef.current.delete(fieldName);
          updateFn();
        });
        fieldRafsRef.current.set(fieldName, rafId);
      } else {
        // Иначе откладываем обновление до восстановления видимости
        pendingUpdatesRef.current.set(fieldName, updateFn);
      }
    },
    []
  );

  /**
   * Оборачивает функцию обновления состояния для предотвращения микро-мерцаний
   * @param updateFn Функция обновления состояния
   * @param fieldName Имя поля (для группировки обновлений)
   */
  const stableUpdateWrapper = useCallback(
    <T extends unknown[]>(
      updateFn: (...args: T) => void,
      fieldName = "_default"
    ) => {
      return (...args: T) => {
        // Регистрируем обновление
        registerFieldUpdate(fieldName, () => updateFn(...args));
      };
    },
    [registerFieldUpdate]
  );

  // Очищаем все колбэки и RAF при размонтировании
  useEffect(() => {
    return () => {
      // Отменяем основной RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Отменяем все RAF для полей
      fieldRafsRef.current.forEach((rafId) => {
        cancelAnimationFrame(rafId);
      });
    };
  }, []);

  return {
    isPageVisible,
    visibilityRef,
    registerFieldUpdate,
    stableUpdateWrapper,
    pendingUpdates: pendingUpdatesRef.current,
  };
}
