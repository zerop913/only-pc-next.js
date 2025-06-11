import { OrderStatus } from "@/types/order";

// Кэш для статусов заказов
let statusesCache: OrderStatus[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Получает статусы заказов из API с кэшированием
 */
export async function getOrderStatuses(): Promise<OrderStatus[]> {
  const now = Date.now();

  // Проверяем кэш
  if (statusesCache && now - cacheTimestamp < CACHE_DURATION) {
    return statusesCache;
  }
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_API_URL
      : "http://localhost:5000";

  const response = await fetch(`${baseUrl}/api/orders/statuses`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order statuses: ${response.status}`);
  }
  const data = await response.json();

  // Проверяем что статусы получены
  if (!data.statuses || !Array.isArray(data.statuses)) {
    throw new Error("Invalid response format: statuses not found");
  }

  // Обновляем кэш
  statusesCache = data.statuses;
  cacheTimestamp = now;

  return data.statuses;
}

/**
 * Получает статус заказа по ID
 */
export async function getOrderStatusById(
  statusId: number
): Promise<OrderStatus | undefined> {
  const statuses = await getOrderStatuses();
  return statuses.find((status) => status.id === statusId);
}

/**
 * Получает человекочитаемое название статуса по ID
 */
export async function getStatusDisplayName(statusId: number): Promise<string> {
  const status = await getOrderStatusById(statusId);
  if (!status) {
    throw new Error(`Status with ID ${statusId} not found`);
  }
  return status.name;
}

/**
 * Получает цвет статуса по ID
 */
export async function getStatusColor(statusId: number): Promise<string> {
  const status = await getOrderStatusById(statusId);
  if (!status) {
    throw new Error(`Status with ID ${statusId} not found`);
  }
  if (!status.color) {
    throw new Error(`Status color for ID ${statusId} not found`);
  }
  return status.color;
}

/**
 * Проверяет, является ли статус финальным (заказ не может быть изменен)
 */
export function isFinalStatus(statusId: number): boolean {
  return statusId === 6 || statusId === 7; // Доставлен или Отменен
}

/**
 * Проверяет, можно ли отменить заказ в данном статусе
 */
export function canCancelOrder(statusId: number): boolean {
  return statusId < 5; // Можно отменить до отправки
}
