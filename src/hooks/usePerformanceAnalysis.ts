import { useRef, useEffect } from "react";

/**
 * Хук для отслеживания и анализа производительности рендеринга компонента
 * Помогает выявить места возможных микро-мерцаний
 *
 * @param componentName Имя компонента для идентификации в логах
 * @param trackRerenders Отслеживать ли повторные рендеры (true по умолчанию)
 * @param trackVisibilityChange Отслеживать ли изменения видимости (true по умолчанию)
 */
export function usePerformanceAnalysis(
  componentName: string,
  trackRerenders = true,
  trackVisibilityChange = true
) {
  // Реф для отслеживания количества рендеров
  const renderCountRef = useRef(0);
  // Реф для отслеживания времени последнего рендера
  const lastRenderTimeRef = useRef(performance.now());
  // Реф для хранения времени между рендерами
  const renderTimesRef = useRef<number[]>([]);
  // Реф для отслеживания видимости страницы
  const visibilityRef = useRef(document.visibilityState === "visible");
  // Реф для отслеживания частых рендеров подряд (признак мерцания)
  const frequentRendersRef = useRef<{ count: number; lastTime: number }>({
    count: 0,
    lastTime: 0,
  });

  // Отслеживаем количество рендеров
  useEffect(() => {
    if (!trackRerenders) return;

    const now = performance.now();
    renderCountRef.current++;

    // Вычисляем время между рендерами
    if (lastRenderTimeRef.current > 0) {
      const timeSinceLastRender = now - lastRenderTimeRef.current;

      // Сохраняем время только если компонент видим
      if (visibilityRef.current) {
        renderTimesRef.current.push(timeSinceLastRender);

        // Обнаруживаем частые рендеры (возможное мерцание)
        if (timeSinceLastRender < 100) {
          // Если последний рендер был менее 100мс назад, увеличиваем счетчик
          if (now - frequentRendersRef.current.lastTime < 300) {
            frequentRendersRef.current.count++;
          } else {
            frequentRendersRef.current.count = 1;
          }

          frequentRendersRef.current.lastTime = now;

          // Выявляем потенциальное мерцание при 3+ быстрых рендерах подряд
          if (frequentRendersRef.current.count >= 3) {
            console.warn(
              `[Performance Warning] Возможное мерцание в компоненте ${componentName}: ${frequentRendersRef.current.count} рендеров за короткий период времени`
            );
          }
        } else {
          // Сбрасываем счетчик, если рендер был не быстрый
          frequentRendersRef.current.count = 0;
        }
      }
    }

    // Обновляем время последнего рендера
    lastRenderTimeRef.current = now;

    // Каждые 20 рендеров анализируем производительность
    if (renderCountRef.current % 20 === 0) {
      const renderTimes = renderTimesRef.current;

      if (renderTimes.length > 0) {
        const averageTime =
          renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
        const maxTime = Math.max(...renderTimes);
        const minTime = Math.min(...renderTimes);

        console.info(
          `[Performance Analysis] ${componentName}:\n` +
            `  Количество рендеров: ${renderCountRef.current}\n` +
            `  Среднее время между рендерами: ${averageTime.toFixed(2)}мс\n` +
            `  Минимальное время: ${minTime.toFixed(2)}мс\n` +
            `  Максимальное время: ${maxTime.toFixed(2)}мс`
        );

        // Очищаем массив времени рендеров
        renderTimesRef.current = [];
      }
    }
  });

  // Отслеживаем изменения видимости страницы
  useEffect(() => {
    if (!trackVisibilityChange) return;

    function handleVisibilityChange() {
      const wasVisible = visibilityRef.current;
      const isVisible = document.visibilityState === "visible";

      if (wasVisible !== isVisible) {
        visibilityRef.current = isVisible;

        // Засекаем время переключения видимости
        const now = performance.now();

        console.info(
          `[Visibility Change] ${componentName} - ${isVisible ? "стал видимым" : "стал невидимым"} в ${now.toFixed(2)}мс`
        );

        // Если страница стала видимой и последний рендер был недавно,
        // отмечаем возможное мерцание
        if (isVisible && now - lastRenderTimeRef.current < 200) {
          console.warn(
            `[Performance Warning] Возможное мерцание при возвращении на вкладку в компоненте ${componentName}`
          );
        }

        // Сбрасываем счетчик частых рендеров при изменении видимости
        frequentRendersRef.current.count = 0;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [componentName, trackVisibilityChange]);

  // Сброс всех данных отслеживания
  const resetTracking = () => {
    renderCountRef.current = 0;
    renderTimesRef.current = [];
    lastRenderTimeRef.current = performance.now();
    frequentRendersRef.current = { count: 0, lastTime: 0 };
  };

  return {
    renderCount: renderCountRef.current,
    resetTracking,
    isPageVisible: visibilityRef.current,
  };
}
