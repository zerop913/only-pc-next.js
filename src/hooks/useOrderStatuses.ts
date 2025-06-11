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
  getStatusColor: (statusId: number) => string | undefined;
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

        const response = await fetch("/api/orders/statuses", {
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
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  const getStatusById = (id: number): OrderStatus | undefined => {
    return statuses.find((status) => status.id === id);
  };
  const getStatusColor = (statusId: number): string | undefined => {
    const status = getStatusById(statusId);
    return status?.color || undefined;
  };
  const getStatusName = (statusId: number): string => {
    const status = getStatusById(statusId);
    return status?.name || "Статус неизвестен";
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
