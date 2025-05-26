"use client";

import { motion } from "framer-motion";
import { UserIcon } from "@heroicons/react/24/outline";
import { IMaskInput } from "react-imask";
import { ChangeEvent } from "react";

interface CustomerInfoFormProps {
  customerInfo: {
    firstName: string;
    lastName: string;
    middleName: string;
    phone: string;
  };
  setCustomerInfo: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      middleName: string;
      phone: string;
    }>
  >;
  hasError: boolean;
}

export default function CustomerInfoForm({
  customerInfo,
  setCustomerInfo,
  hasError,
}: CustomerInfoFormProps) {
  return (
    <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-400/70" />
          Информация о покупателе
        </h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-5">
          {" "}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-secondary-light mb-2">
                Фамилия
              </label>
              <input
                type="text"
                value={customerInfo.lastName}
                onChange={(e) =>
                  setCustomerInfo({
                    ...customerInfo,
                    lastName: e.target.value,
                  })
                }
                className={`w-full bg-primary/50 border ${
                  hasError && !customerInfo.lastName
                    ? "border-red-500"
                    : "border-primary-border"
                } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Введите фамилию"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-light mb-2">
                Имя
              </label>
              <input
                type="text"
                value={customerInfo.firstName}
                onChange={(e) =>
                  setCustomerInfo({
                    ...customerInfo,
                    firstName: e.target.value,
                  })
                }
                className={`w-full bg-primary/50 border ${
                  hasError && !customerInfo.firstName
                    ? "border-red-500"
                    : "border-primary-border"
                } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Введите имя"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-light mb-2">
                Отчество
              </label>
              <input
                type="text"
                value={customerInfo.middleName}
                onChange={(e) =>
                  setCustomerInfo({
                    ...customerInfo,
                    middleName: e.target.value,
                  })
                }
                className={`w-full bg-primary/50 border ${
                  hasError && !customerInfo.middleName
                    ? "border-red-500"
                    : "border-primary-border"
                } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Введите отчество"
              />
            </div>
          </div>{" "}
          <div className="mt-5">
            <label className="block text-sm font-medium text-secondary-light mb-2">
              Номер телефона
            </label>{" "}
            <IMaskInput
              mask="+{7} (000) 000-00-00"
              definitions={{
                "#": /[1-9]/,
              }}
              type="tel"
              value={customerInfo.phone}
              onAccept={(value: any) =>
                setCustomerInfo({
                  ...customerInfo,
                  phone: value,
                })
              }
              className={`w-full bg-primary/50 border ${
                hasError && !customerInfo.phone
                  ? "border-red-500"
                  : "border-primary-border"
              } rounded-lg p-3 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="+7 (___) ___-__-__"
              unmask={false}
            />
          </div>
          {hasError && (
            <motion.p
              className="mt-2 text-sm text-red-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Пожалуйста, заполните все поля информации о покупателе
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
