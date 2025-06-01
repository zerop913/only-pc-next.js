import { useState, useEffect } from "react";
import { fetchApi } from "../utils/apiUtils";

interface DeliveryPoint {
  id: number;
  street: string;
  house: string;
  apartment: string;
  city: string;
  postalCode: string;
}

export function useDeliveryPoints() {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryPoints = async () => {
    try {
      setLoading(true);
      const response = await fetchApi("/api/delivery-points");

      if (!response.ok) {
        throw new Error("Failed to fetch delivery points");
      }

      const data = await response.json();
      setDeliveryPoints(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при загрузке пунктов доставки"
      );
    } finally {
      setLoading(false);
    }
  };

  const addDeliveryPoint = async (point: Omit<DeliveryPoint, "id">) => {
    try {
      const response = await fetchApi("/api/delivery-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(point),
      });

      if (!response.ok) {
        throw new Error("Failed to add delivery point");
      }

      const newPoint = await response.json();
      setDeliveryPoints((prev) => [...prev, newPoint]);
      return newPoint;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при добавлении пункта доставки"
      );
      throw err;
    }
  };

  const updateDeliveryPoint = async (
    id: number,
    point: Partial<DeliveryPoint>
  ) => {
    try {
      const response = await fetch(`/api/delivery-points/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(point),
      });

      if (!response.ok) {
        throw new Error("Failed to update delivery point");
      }

      const updatedPoint = await response.json();
      setDeliveryPoints((prev) =>
        prev.map((p) => (p.id === id ? updatedPoint : p))
      );
      return updatedPoint;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при обновлении пункта доставки"
      );
      throw err;
    }
  };

  const deleteDeliveryPoint = async (id: number) => {
    try {
      const response = await fetch(`/api/delivery-points/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete delivery point");
      }

      setDeliveryPoints((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при удалении пункта доставки"
      );
      throw err;
    }
  };

  useEffect(() => {
    fetchDeliveryPoints();
  }, []);

  return {
    deliveryPoints,
    loading,
    error,
    addDeliveryPoint,
    updateDeliveryPoint,
    deleteDeliveryPoint,
    refreshDeliveryPoints: fetchDeliveryPoints,
  };
}
