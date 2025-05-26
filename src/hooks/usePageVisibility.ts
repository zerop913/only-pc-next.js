import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";

/**
 * Хук для отслеживания видимости страницы и предотвращения микрообновлений
 * @param onVisible - Функция, вызываемая, когда страница становится видимой
 * @param onHidden - Функция, вызываемая, когда страница скрывается
 */
export function usePageVisibility(
  onVisible?: () => void,
  onHidden?: () => void
): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  const visibilityRef = useRef<boolean>(isVisible);
  const onVisibleRef = useRef(onVisible);
  const onHiddenRef = useRef(onHidden);

  // Обновляем рефы при изменении колбэков
  useEffect(() => {
    onVisibleRef.current = onVisible;
    onHiddenRef.current = onHidden;
  }, [onVisible, onHidden]);

  useEffect(() => {
    function handleVisibilityChange() {
      const wasVisible = visibilityRef.current;
      const isNowVisible = document.visibilityState === "visible";

      // Обновляем состояние только если оно изменилось
      if (wasVisible !== isNowVisible) {
        visibilityRef.current = isNowVisible;
        setIsVisible(isNowVisible);

        // Вызываем соответствующий колбэк
        if (isNowVisible) {
          onVisibleRef.current?.();
        } else {
          onHiddenRef.current?.();
        }
      }
    }

    // Добавляем слушатель события изменения видимости
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Хук для управления блокировкой обновлений при переключении видимости страницы
 */
export function useUpdateBlocker() {
  const updatesBlockedRef = useRef(false);
  const pendingUpdatesRef = useRef<Record<string, any>>({});

  const blockUpdates = () => {
    updatesBlockedRef.current = true;
  };

  const unblockUpdates = (
    applyPendingUpdates?: (updates: Record<string, any>) => void
  ) => {
    const hasUpdates = Object.keys(pendingUpdatesRef.current).length > 0;

    if (hasUpdates && applyPendingUpdates) {
      applyPendingUpdates(pendingUpdatesRef.current);
    }

    pendingUpdatesRef.current = {};
    updatesBlockedRef.current = false;
  };

  const addPendingUpdate = (key: string, value: any) => {
    pendingUpdatesRef.current[key] = value;
  };

  const isPendingUpdate = (key: string): boolean => {
    return key in pendingUpdatesRef.current;
  };

  const isBlocked = (): boolean => {
    return updatesBlockedRef.current;
  };

  return {
    blockUpdates,
    unblockUpdates,
    addPendingUpdate,
    isPendingUpdate,
    isBlocked,
    pendingUpdatesRef,
    blockedRef: updatesBlockedRef,
  };
}
