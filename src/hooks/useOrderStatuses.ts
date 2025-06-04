"use client";

import { useState, useEffect } from "react";

interface OrderStatus {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

interface UseOrderStatusesReturn {
  statuses: OrderStatus[];
  loading: boolean;
  error: string | null;
  getStatusById: (id: number) => OrderStatus | undefined;
  getStatusColor: (statusId: number) => string;
  getStatusName: (statusId: number) => string;
}

export const useOrderStatuses = (): UseOrderStatusesReturn => {
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/order-statuses", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка получения статусов: ${response.status}`);
        }

        const data = await response.json();
        if (data.statuses && Array.isArray(data.statuses)) {
          setStatuses(data.statuses);
        } else {
          throw new Error("Некорректный формат данных статусов");
        }
      } catch (err) {
        console.error("Ошибка при загрузке статусов заказов:", err);
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
        
        // Fallback статусы на случай ошибки API
        setStatuses([
          { id: 1, name: "Новый", color: "#3B82F6" },
          { id: 2, name: "Подтвержден", color: "#F59E0B" },
          { id: 3, name: "Оплачен", color: "#8B5CF6" },
          { id: 4, name: "В сборке", color: "#06B6D4" },
          { id: 5, name: "Отправлен", color: "#10B981" },
          { id: 6, name: "Доставлен", color: "#059669" },
          { id: 7, name: "Отменен", color: "#EF4444" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  const getStatusById = (id: number): OrderStatus | undefined => {
    return statuses.find(status => status.id === id);
  };

  const getStatusColor = (statusId: number): string => {
    const status = getStatusById(statusId);
    if (!status?.color) {
      // Fallback цвета для статусов без цвета
      const fallbackColors: Record<number, string> = {
        1: "#3B82F6", // blue
        2: "#F59E0B", // yellow
        3: "#8B5CF6", // purple
        4: "#06B6D4", // cyan
        5: "#10B981", // emerald
        6: "#059669", // emerald-600
        7: "#EF4444", // red
      };
      return fallbackColors[statusId] || "#6B7280"; // gray as default
    }
    return status.color;
  };

  const getStatusName = (statusId: number): string => {
    const status = getStatusById(statusId);
    return status?.name || "Неизвестен";
  };

  return {
    statuses,
    loading,
    error,
    getStatusById,
    getStatusColor,
    getStatusName,
  };
};
