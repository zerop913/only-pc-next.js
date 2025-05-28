"use client";

import { motion } from "framer-motion";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { DeliveryMethod, DeliveryAddress } from "@/types/order";

interface DeliveryAddressFormProps {
  selectedDeliveryMethod: DeliveryMethod | null;
  deliveryAddress: {
    recipientName: string;
    phoneNumber: string;
    city: string;
    postalCode: string;
    streetAddress: string;
    isDefault: boolean;
    deliveryMethodId: number | null;
  };
  setDeliveryAddress: React.Dispatch<
    React.SetStateAction<{
      recipientName: string;
      phoneNumber: string;
      city: string;
      postalCode: string;
      streetAddress: string;
      isDefault: boolean;
      deliveryMethodId: number | null;
    }>
  >;
  savedAddresses?: DeliveryAddress[];
  selectedSavedAddressId?: number | null;
  onSavedAddressSelect?: (addressId: number) => void;
  hasError: boolean;
}

export default function DeliveryAddressForm({
  selectedDeliveryMethod,
  deliveryAddress,
  setDeliveryAddress,
  savedAddresses = [],
  selectedSavedAddressId,
  onSavedAddressSelect,
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
  // Функция обновления флага "по умолчанию" для существующего адреса
  const updateAddressDefault = async (
    addressId: number,
    isDefault: boolean
  ) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDefault }),
      });

      if (response.ok) {
        console.log("Адрес по умолчанию успешно обновлен");
        // Если в ответе есть список обновленных адресов, можно обновить наш список на стороне клиента
      } else {
        console.error("Ошибка при обновлении адреса по умолчанию");
      }
    } catch (error) {
      console.error("Ошибка при обновлении адреса:", error);
    }
  };

  return (
    <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-blue-400/70" />
          Адрес доставки{" "}
          {selectedDeliveryMethod ? `(${selectedDeliveryMethod.name})` : ""}
        </h2>
      </div>{" "}
      <div className="p-5">
        {/* Блок с сохраненными адресами */}
        {savedAddresses.length > 0 && onSavedAddressSelect && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-secondary-light mb-2">
              Выберите сохраненный адрес
            </label>
            <div className="grid grid-cols-1 gap-3">
              {" "}
              {savedAddresses
                .filter(
                  (address) =>
                    // Показываем только адреса, которые либо не привязаны к методу доставки,
                    // либо привязаны к текущему методу доставки
                    address.deliveryMethodId === null ||
                    (selectedDeliveryMethod &&
                      address.deliveryMethodId === selectedDeliveryMethod.id)
                )
                .map((address) => (
                  <div
                    key={address.id}
                    onClick={() => onSavedAddressSelect(address.id)}
                    className={`cursor-pointer p-3 border rounded-lg transition-colors ${
                      selectedSavedAddressId === address.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-primary-border bg-primary/40 hover:bg-primary/60"
                    }`}
                  >
                    <div className="font-medium text-white">
                      {address.recipientName}, тел. {address.phoneNumber}
                    </div>
                    <div className="text-sm text-secondary-light">
                      {address.city}, {address.postalCode}
                    </div>
                    <div className="text-sm text-secondary-light truncate">
                      {address.streetAddress}
                    </div>
                    {address.isDefault && (
                      <div className="mt-1">
                        <span className="inline-flex items-center bg-blue-500/30 text-blue-300 text-xs px-1.5 py-0.5 rounded">
                          Адрес по умолчанию
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            <div className="text-sm text-secondary-light mt-2">
              или введите новый адрес:
            </div>
            <hr className="my-4 border-primary-border/50" />
          </div>
        )}
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
        </div>{" "}
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={deliveryAddress.isDefault}
              onChange={(e) => {
                // Обновляем локальное состояние
                setDeliveryAddress((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }));

                // Если выбран существующий адрес, обновляем его в базе
                if (
                  selectedSavedAddressId &&
                  onSavedAddressSelect &&
                  e.target.checked
                ) {
                  // Отправляем запрос на обновление флага isDefault у существующего адреса
                  updateAddressDefault(
                    selectedSavedAddressId,
                    e.target.checked
                  );
                }
              }}
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
