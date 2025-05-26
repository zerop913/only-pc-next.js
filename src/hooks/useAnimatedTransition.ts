import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Хук для управления анимированным переходами между состояниями с оптимизацией для
 * предотвращения микро-мерцаний при переключении вкладок или мониторов
 *
 * @param initialValue Начальное значение активного состояния
 */
export function useAnimatedTransition(initialValue: number = 0) {
  const [activeState, setActiveState] = useState(initialValue);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastCompletedState, setLastCompletedState] = useState(initialValue);

  // Реф для отслеживания предыдущего активного состояния
  const prevStateRef = useRef(initialValue);

  // Реф для отслеживания видимости страницы
  const visibleRef = useRef(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  // Реф для отслеживания запланированных переходов
  const pendingTransitionRef = useRef<number | null>(null);

  // Реф для отслеживания ID requestAnimationFrame
  const rafIdRef = useRef<number | null>(null);

  // Обработчик изменения видимости страницы
  useEffect(() => {
    function handleVisibilityChange() {
      const isVisible = document.visibilityState === "visible";
      visibleRef.current = isVisible;

      // Если страница стала видимой и есть запланированный переход
      if (isVisible && pendingTransitionRef.current !== null) {
        // Выполняем переход без анимации для предотвращения мерцания
        const targetState = pendingTransitionRef.current;

        // Отменяем текущую анимацию, если она есть
        if (isAnimating && rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        // Выполняем мгновенный переход
        setActiveState(targetState);
        setLastCompletedState(targetState);
        setIsAnimating(false);

        // Очищаем запланированный переход
        pendingTransitionRef.current = null;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAnimating]);

  /**
   * Переход к новому состоянию с анимацией
   * @param newState Новое активное состояние
   * @param skipAnimation Если true, анимация будет пропущена
   */
  const goToState = useCallback(
    (newState: number, skipAnimation = false) => {
      // Если новое состояние совпадает с текущим, ничего не делаем
      if (newState === activeState) return;

      // Определяем направление перехода
      const newDirection =
        newState > prevStateRef.current ? "forward" : "backward";
      prevStateRef.current = newState;

      // Если страница не видна, откладываем переход
      if (!visibleRef.current) {
        pendingTransitionRef.current = newState;
        return;
      }

      // Если нужно пропустить анимацию
      if (skipAnimation) {
        setActiveState(newState);
        setLastCompletedState(newState);
        return;
      }

      // Начинаем анимацию
      setDirection(newDirection);
      setIsAnimating(true);

      // Используем RAF для управления анимацией
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setActiveState(newState);

        // Устанавливаем таймер завершения анимации
        setTimeout(() => {
          setIsAnimating(false);
          setLastCompletedState(newState);
        }, 500); // 500мс - типичная длительность анимации
      });
    },
    [activeState]
  );

  /**
   * Переход к следующему состоянию
   */
  const nextState = useCallback(() => {
    goToState(activeState + 1);
  }, [activeState, goToState]);

  /**
   * Переход к предыдущему состоянию
   */
  const prevState = useCallback(() => {
    if (activeState > 0) {
      goToState(activeState - 1);
    }
  }, [activeState, goToState]);

  // Очищаем RAF при размонтировании
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    activeState,
    lastCompletedState,
    direction,
    isAnimating,
    goToState,
    nextState,
    prevState,
  };
}
