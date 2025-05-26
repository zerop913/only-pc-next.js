import { useState, useRef, useEffect, useCallback } from "react";
import { usePageVisibility } from "./usePageVisibility";

/**
 * Хук для выполнения фоновых задач с учетом видимости страницы.
 * Задачи выполняются с помощью requestAnimationFrame или setTimeout в зависимости от видимости страницы
 * и имеют возможность отмены.
 */
export function useBackgroundTask() {
  // Используем хук для отслеживания видимости страницы
  const isVisible = usePageVisibility();

  // Референсы для хранения состояния задач
  const tasksRef = useRef<
    Map<
      string,
      {
        id: number | NodeJS.Timeout;
        type: "raf" | "timeout";
        callback: () => void;
      }
    >
  >(new Map());

  // Референс для хранения приоритетов задач
  const prioritiesRef = useRef<Map<string, number>>(new Map());

  // Состояние для отслеживания выполняющихся задач
  const [runningTasks, setRunningTasks] = useState<string[]>([]);

  /**
   * Планирует выполнение задачи с учетом видимости страницы
   * @param taskId Уникальный идентификатор задачи
   * @param callback Функция, которую нужно выполнить
   * @param delay Задержка для setTimeout (в случае, если страница не видна)
   * @param priority Приоритет задачи (чем выше, тем важнее)
   */
  const scheduleTask = useCallback(
    (
      taskId: string,
      callback: () => void,
      delay: number = 300,
      priority: number = 0
    ) => {
      // Отменяем предыдущую задачу с таким же ID, если она существует
      cancelTask(taskId);

      // Сохраняем приоритет задачи
      prioritiesRef.current.set(taskId, priority);

      // Обновляем список выполняющихся задач
      setRunningTasks((prev) => Array.from(new Set([...prev, taskId])));

      // Выбираем способ выполнения задачи в зависимости от видимости страницы
      if (isVisible) {
        // Если страница видна, используем requestAnimationFrame для более плавной анимации
        const rafId = requestAnimationFrame(() => {
          callback();
          tasksRef.current.delete(taskId);
          setRunningTasks((prev) => prev.filter((id) => id !== taskId));
        });

        tasksRef.current.set(taskId, { id: rafId, type: "raf", callback });
      } else {
        // Если страница не видна, используем setTimeout с указанной задержкой
        const timeoutId = setTimeout(() => {
          callback();
          tasksRef.current.delete(taskId);
          setRunningTasks((prev) => prev.filter((id) => id !== taskId));
        }, delay);

        tasksRef.current.set(taskId, {
          id: timeoutId,
          type: "timeout",
          callback,
        });
      }
    },
    [isVisible]
  );

  /**
   * Отменяет запланированную задачу
   * @param taskId Идентификатор задачи для отмены
   */
  const cancelTask = useCallback((taskId: string) => {
    const task = tasksRef.current.get(taskId);

    if (task) {
      if (task.type === "raf") {
        cancelAnimationFrame(task.id as number);
      } else {
        clearTimeout(task.id as NodeJS.Timeout);
      }

      tasksRef.current.delete(taskId);
      setRunningTasks((prev) => prev.filter((id) => id !== taskId));
    }
  }, []);

  /**
   * Отменяет все запланированные задачи
   */
  const cancelAllTasks = useCallback(() => {
    tasksRef.current.forEach((task, taskId) => {
      if (task.type === "raf") {
        cancelAnimationFrame(task.id as number);
      } else {
        clearTimeout(task.id as NodeJS.Timeout);
      }
    });

    tasksRef.current.clear();
    setRunningTasks([]);
  }, []);

  /**
   * Выполняет приоритетную задачу немедленно
   * @param taskId Идентификатор задачи для выполнения
   */
  const executeTaskNow = useCallback((taskId: string) => {
    const task = tasksRef.current.get(taskId);

    if (task) {
      // Отменяем запланированное выполнение
      if (task.type === "raf") {
        cancelAnimationFrame(task.id as number);
      } else {
        clearTimeout(task.id as NodeJS.Timeout);
      }

      // Выполняем задачу немедленно
      task.callback();

      // Удаляем задачу из списка
      tasksRef.current.delete(taskId);
      setRunningTasks((prev) => prev.filter((id) => id !== taskId));
    }
  }, []);

  /**
   * Проверяет, выполняется ли задача с указанным идентификатором
   * @param taskId Идентификатор задачи для проверки
   */
  const isTaskRunning = useCallback((taskId: string) => {
    return tasksRef.current.has(taskId);
  }, []);

  /**
   * При изменении видимости страницы, перепланируем все задачи
   * При появлении страницы - выполняем приоритетные задачи сразу
   */
  useEffect(() => {
    if (isVisible && tasksRef.current.size > 0) {
      // Создаем копию текущих задач для перепланирования
      const currentTasks = new Map(tasksRef.current);

      // Сортируем задачи по приоритету
      const sortedTaskIds = Array.from(currentTasks.keys()).sort((a, b) => {
        const priorityA = prioritiesRef.current.get(a) || 0;
        const priorityB = prioritiesRef.current.get(b) || 0;
        return priorityB - priorityA; // Сортировка по убыванию приоритета
      });

      // Отменяем все текущие задачи
      cancelAllTasks();

      // Перепланируем задачи с высоким приоритетом немедленно, остальные через requestAnimationFrame
      sortedTaskIds.forEach((taskId, index) => {
        const task = currentTasks.get(taskId);
        if (task) {
          if ((index < 3 && prioritiesRef.current.get(taskId)) || 0 > 5) {
            // Выполняем высокоприоритетные задачи немедленно
            task.callback();
          } else {
            // Перепланируем остальные задачи
            scheduleTask(
              taskId,
              task.callback,
              0,
              prioritiesRef.current.get(taskId) || 0
            );
          }
        }
      });
    }
  }, [isVisible, cancelAllTasks, scheduleTask]);

  // Очищаем все задачи при размонтировании компонента
  useEffect(() => {
    return () => {
      cancelAllTasks();
    };
  }, [cancelAllTasks]);

  return {
    scheduleTask,
    cancelTask,
    cancelAllTasks,
    executeTaskNow,
    isTaskRunning,
    runningTasks,
  };
}
