import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";

/**
 * Хук для безопасного обновления состояния, который предотвращает микрообновления
 * и излишние ререндеры при переключении вкладок
 */
export function useSafeState<T>(
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Обычный useState для реактивности
  const [state, setState] = useState<T>(initialValue);

  // Реф для отслеживания реального значения без ререндеров
  const stateRef = useRef<T>(initialValue);

  // Реф для отслеживания видимости страницы
  const visibleRef = useRef<boolean>(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  // Реф для отложенных обновлений
  const pendingUpdateRef = useRef<SetStateAction<T> | null>(null);

  // Настраиваем обработчик изменения видимости страницы
  useEffect(() => {
    function handleVisibilityChange() {
      const newVisibility = document.visibilityState === "visible";
      visibleRef.current = newVisibility;

      // Если страница становится видимой и есть отложенные обновления - применяем их
      if (newVisibility && pendingUpdateRef.current !== null) {
        // Применяем отложенное обновление
        setState(pendingUpdateRef.current);
        // Очищаем отложенное обновление
        pendingUpdateRef.current = null;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Безопасная функция установки состояния
  const setSafeState = useCallback((value: SetStateAction<T>) => {
    // Всегда обновляем реф
    if (typeof value === "function") {
      const updateFn = value as (prevState: T) => T;
      stateRef.current = updateFn(stateRef.current);
    } else {
      stateRef.current = value;
    }

    // Если страница видима - обновляем состояние сразу
    if (visibleRef.current) {
      setState(value);
    } else {
      // Иначе - откладываем обновление до появления страницы
      pendingUpdateRef.current = value;
    }
  }, []);

  return [state, setSafeState];
}
