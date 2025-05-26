import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";

/**
 * Хук для управления состоянием с дебаунсом и учетом видимости страницы
 *
 * @param initialValue Начальное значение состояния
 * @param delay Задержка дебаунса в миллисекундах
 * @param storageKey Ключ для сохранения в sessionStorage (не сохраняется, если не указан)
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 250,
  storageKey?: string
): [T, Dispatch<SetStateAction<T>>, T] {
  // Состояние для рендеринга
  const [state, setState] = useState<T>(() => {
    // Пытаемся загрузить сохраненное значение, если указан storageKey
    if (typeof window !== "undefined" && storageKey) {
      try {
        const savedValue = sessionStorage.getItem(storageKey);
        if (savedValue) return JSON.parse(savedValue);
      } catch (err) {
        console.error("Ошибка загрузки из sessionStorage:", err);
      }
    }
    return initialValue;
  });

  // Реф для хранения актуального значения без ререндеров
  const valueRef = useRef<T>(state);

  // Реф для отслеживания видимости страницы
  const isVisibleRef = useRef<boolean>(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  // Реф для хранения таймера дебаунса
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Реф для отложенных обновлений при скрытой странице
  const pendingUpdateRef = useRef<SetStateAction<T> | null>(null);

  // Обработчик изменения видимости страницы
  useEffect(() => {
    function handleVisibilityChange() {
      const isVisible = document.visibilityState === "visible";
      isVisibleRef.current = isVisible;

      // Если страница стала видимой и есть отложенное обновление, применяем его
      if (isVisible && pendingUpdateRef.current !== null) {
        setState(pendingUpdateRef.current);
        pendingUpdateRef.current = null;

        // Если нужно сохранить в sessionStorage
        if (storageKey) {
          const valueToSave =
            typeof pendingUpdateRef.current === "function"
              ? (pendingUpdateRef.current as Function)(valueRef.current)
              : pendingUpdateRef.current;

          try {
            sessionStorage.setItem(storageKey, JSON.stringify(valueToSave));
          } catch (err) {
            console.error("Ошибка сохранения в sessionStorage:", err);
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [storageKey]);

  // Функция обновления состояния с дебаунсом
  const setDebouncedState = useCallback(
    (value: SetStateAction<T>) => {
      // Обновляем valueRef сразу, чтобы иметь актуальное значение
      if (typeof value === "function") {
        const updateFn = value as (prev: T) => T;
        valueRef.current = updateFn(valueRef.current);
      } else {
        valueRef.current = value;
      }

      // Очищаем предыдущий таймер, если он был
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Если страница видима, обновляем состояние с дебаунсом
      if (isVisibleRef.current) {
        timerRef.current = setTimeout(() => {
          setState(valueRef.current);

          // Если нужно сохранить в sessionStorage
          if (storageKey) {
            try {
              sessionStorage.setItem(
                storageKey,
                JSON.stringify(valueRef.current)
              );
            } catch (err) {
              console.error("Ошибка сохранения в sessionStorage:", err);
            }
          }
        }, delay);
      } else {
        // Если страница не видима, откладываем обновление
        pendingUpdateRef.current = valueRef.current;
      }
    },
    [delay, storageKey]
  );

  return [state, setDebouncedState, valueRef.current];
}
