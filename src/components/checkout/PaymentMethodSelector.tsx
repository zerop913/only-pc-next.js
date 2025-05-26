"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCardIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { PaymentMethod } from "@/types/order";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  setSelectedMethod: React.Dispatch<React.SetStateAction<PaymentMethod | null>>;
  hasError: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  setSelectedMethod,
  hasError,
}: PaymentMethodSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/orders/payment-methods");

        if (!response.ok) {
          throw new Error("Не удалось загрузить методы оплаты");
        }

        const data = await response.json();
        setPaymentMethods(data.paymentMethods);

        // Если методы загружены и ранее не был выбран метод, устанавливаем первый метод по умолчанию
        if (data.paymentMethods.length > 0 && !selectedMethod) {
          setSelectedMethod(data.paymentMethods[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка");
        console.error("Ошибка при загрузке методов оплаты:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  return (
    <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-blue-400/70" />
          Способ оплаты
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
            {paymentMethods.map((method) => (
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
                  <div>
                    <h3 className="font-medium text-white">{method.name}</h3>
                    {method.description && (
                      <p className="text-sm text-secondary-light mt-1">
                        {method.description}
                      </p>
                    )}
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
            Пожалуйста, выберите способ оплаты
          </motion.p>
        )}
      </div>
    </div>
  );
}
