"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface QrCodeHelpModalProps {
  onClose: () => void;
}

export default function QrCodeHelpModal({ onClose }: QrCodeHelpModalProps) {
  const steps = [
    {
      title: "Откройте приложение банка",
      description: "Найдите функцию оплаты по QR-коду или СБП.",
      icon: "📱",
    },
    {
      title: "Выберите сканирование кода",
      description: "Обычно находится в разделе платежей.",
      icon: "🔍",
    },
    {
      title: "Отсканируйте QR-код",
      description: "Наведите камеру телефона на QR-код.",
      icon: "📷",
    },
    {
      title: "Проверьте данные",
      description: "Все детали заказа отображаются на русском языке.",
      icon: "✓",
    },
    {
      title: "Подтвердите оплату",
      description: "Нажмите кнопку 'Оплатить' в приложении.",
      icon: "💳",
    },
    {
      title: "Дождитесь подтверждения",
      description: "Нажмите 'Я оплатил заказ' на странице.",
      icon: "✅",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-md bg-primary rounded-xl shadow-xl border border-primary-border overflow-hidden max-h-[90vh] overflow-y-auto"
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              Как оплатить по QR-коду
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-3 bg-gradient-from/5 p-3 rounded-lg border border-primary-border/30"
              >
                <div className="w-8 h-8 flex-shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm flex items-center gap-1">
                    <span className="text-blue-400 font-semibold">
                      {index + 1}.
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-secondary-light text-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
              <h4 className="text-blue-300 font-medium text-sm mb-1 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  />
                </svg>
                Важно
              </h4>
              <p className="text-secondary-light text-xs">
                Убедитесь, что ваш банк поддерживает СБП. Для оплаты требуется
                интернет и доступ к приложению банка.
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-all"
            >
              Понятно
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
