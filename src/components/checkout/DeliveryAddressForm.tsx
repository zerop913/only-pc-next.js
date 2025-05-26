"use client";

import { motion } from "framer-motion";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { DeliveryMethod } from "@/types/order";

interface DeliveryAddressFormProps {
  selectedDeliveryMethod: DeliveryMethod | null;
  deliveryAddress: {
    recipientName: string;
    phoneNumber: string;
    city: string;
    postalCode: string;
    streetAddress: string;
    isDefault: boolean;
  };
  setDeliveryAddress: React.Dispatch<
    React.SetStateAction<{
      recipientName: string;
      phoneNumber: string;
      city: string;
      postalCode: string;
      streetAddress: string;
      isDefault: boolean;
    }>
  >;
  hasError: boolean;
}

export default function DeliveryAddressForm({
  selectedDeliveryMethod,
  deliveryAddress,
  setDeliveryAddress,
  hasError,
}: DeliveryAddressFormProps) {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDeliveryAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-blue-400/70" />
          Адрес доставки{" "}
          {selectedDeliveryMethod ? `(${selectedDeliveryMethod.name})` : ""}
        </h2>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-secondary-light mb-2">
              Город
            </label>
            <input
              type="text"
              name="city"
              value={deliveryAddress.city}
              onChange={handleInputChange}
              className={`w-full bg-primary/50 border ${
                hasError && !deliveryAddress.city
                  ? "border-red-500"
                  : "border-primary-border"
              } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Введите город"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-light mb-2">
              Почтовый индекс
            </label>
            <input
              type="text"
              name="postalCode"
              value={deliveryAddress.postalCode}
              onChange={handleInputChange}
              className={`w-full bg-primary/50 border ${
                hasError && !deliveryAddress.postalCode
                  ? "border-red-500"
                  : "border-primary-border"
              } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Введите индекс"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-secondary-light mb-2">
            Адрес пункта выдачи
          </label>
          <textarea
            name="streetAddress"
            value={deliveryAddress.streetAddress}
            onChange={handleInputChange}
            rows={3}
            className={`w-full bg-primary/50 border ${
              hasError && !deliveryAddress.streetAddress
                ? "border-red-500"
                : "border-primary-border"
            } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none`}
            placeholder="Введите полный адрес доставки"
          />
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={deliveryAddress.isDefault}
              onChange={(e) =>
                setDeliveryAddress((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-secondary-light">
              Использовать как адрес по умолчанию
            </span>
          </label>
        </div>

        {hasError && (
          <motion.p
            className="mt-2 text-sm text-red-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Пожалуйста, заполните все поля адреса доставки
          </motion.p>
        )}
      </div>
    </div>
  );
}
