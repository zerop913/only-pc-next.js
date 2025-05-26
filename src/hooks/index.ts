// Экспортируем все хуки для оптимизации производительности
export * from "./useSafeState";
export * from "./usePageVisibility";
export * from "./useDebouncedState";
export * from "./useBackgroundTask";
export * from "./useFormStableRender";
export * from "./useAnimatedTransition";
export * from "./usePerformanceAnalysis";
export * from "./useDeliveryPoints";

// Экспорт по умолчанию для обратной совместимости
import { useSafeState } from "./useSafeState";
export default useSafeState;
