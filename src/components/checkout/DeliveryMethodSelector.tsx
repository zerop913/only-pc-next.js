"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TruckIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { DeliveryMethod } from "@/types/order";

interface DeliveryMethodSelectorProps {
  selectedMethod: DeliveryMethod | null;
  setSelectedMethod: React.Dispatch<
    React.SetStateAction<DeliveryMethod | null>
  >;
  hasError: boolean;
}

export default function DeliveryMethodSelector({
  selectedMethod,
  setSelectedMethod,
  hasError,
}: DeliveryMethodSelectorProps) {
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveryMethods = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/orders/delivery-methods");

        if (!response.ok) {
          throw new Error("Не удалось загрузить методы доставки");
        }

        const data = await response.json();
        setDeliveryMethods(data.deliveryMethods);

        // Если методы загружены и ранее не был выбран метод, устанавливаем первый метод по умолчанию
        if (data.deliveryMethods.length > 0 && !selectedMethod) {
          setSelectedMethod(data.deliveryMethods[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка");
        console.error("Ошибка при загрузке методов доставки:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveryMethods();
  }, []);

  return (
    <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <TruckIcon className="w-5 h-5 text-blue-400/70" />
          Способ доставки
        </h2>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-secondary-light">Загрузка...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : (
          <div className="grid gap-4">
            {deliveryMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`cursor-pointer border ${
                  selectedMethod?.id === method.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-primary-border"
                } rounded-lg p-4 transition-all duration-200 hover:border-blue-500/70`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{method.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-secondary-light text-sm">
                        {method.description}
                      </p>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {parseInt(method.price).toLocaleString()} ₽
                        </p>
                        {method.estimatedDays && (
                          <p className="text-xs text-secondary-light">
                            {method.estimatedDays}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedMethod?.id === method.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircleIcon className="w-6 h-6 text-blue-500 ml-4" />
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasError && (
          <motion.p
            className="mt-4 text-sm text-red-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Пожалуйста, выберите способ доставки
          </motion.p>
        )}
      </div>
    </div>
  );
}
