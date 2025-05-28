"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  QrCodeIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { useModal } from "@/contexts/ModalContext";
import { QRCodeSVG } from "qrcode.react";

interface PaymentQrCodeProps {
  orderDetails: {
    orderNumber?: string;
    items: {
      name: string;
      price: number;
      quantity: number;
      categoryName: string;
      variant?: string;
    }[];
    totalPrice: number;
    deliveryMethod?: {
      name: string;
      price: number;
    };
  };
  onCheckPayment: () => Promise<void>;
  onRefreshQrCode: () => Promise<void>;
  isLoading: boolean;
  isChecking: boolean;
  qrCodeUrl: string;
}

export default function PaymentQrCode({
  orderDetails,
  onCheckPayment,
  onRefreshQrCode,
  isLoading,
  isChecking,
  qrCodeUrl,
}: PaymentQrCodeProps) {
  const { openQrCodeHelpModal } = useModal();
  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-secondary-light">Генерация QR-кода...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* QR-код */}
          <div className="bg-white p-4 rounded-lg mb-6 relative">
            {/* QR-код изображение */}
            <div className="w-64 h-64 bg-white flex items-center justify-center">
              {" "}
              {qrCodeUrl ? (
                qrCodeUrl.startsWith("data:image") ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR-код для оплаты"
                    className="max-w-full h-auto"
                    style={{ width: 240, height: 240 }}
                  />
                ) : (
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={240}
                    level="H"
                    includeMargin={true}
                    className="max-w-full h-auto"
                  />
                )
              ) : (
                <p className="text-black text-center">
                  Не удалось загрузить QR-код
                </p>
              )}
            </div>
          </div>{" "}
          <div className="text-center mb-6">
            <p className="text-white font-semibold mb-1">Сумма к оплате:</p>
            <p className="text-2xl font-bold text-white">
              {orderDetails.totalPrice.toLocaleString()} ₽
            </p>{" "}
            <p className="text-xs text-secondary-light mt-1">
              В приложении банка вы увидите полные детали заказа
            </p>
          </div>
          <div className="space-y-4 w-full max-w-md">
            {/* Кнопка инструкции по оплате */}
            <button
              onClick={openQrCodeHelpModal}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-from/20 hover:bg-gradient-from/30 border border-primary-border rounded-lg transition text-white"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 text-blue-400" />
              Как оплатить по QR-коду?
            </button>

            {/* Кнопка обновления QR-кода */}
            <button
              onClick={onRefreshQrCode}
              disabled={isLoading || isChecking}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-transparent hover:bg-gradient-from/30 border border-primary-border rounded-lg transition text-secondary-light hover:text-white"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Обновить QR-код
            </button>

            {/* Кнопка проверки платежа */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCheckPayment}
              disabled={isLoading || isChecking}
              className={`w-full relative overflow-hidden bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ${
                isLoading || isChecking ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isChecking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Проверка...
                  </>
                ) : (
                  <>Я оплатил заказ</>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      )}
    </>
  );
}
