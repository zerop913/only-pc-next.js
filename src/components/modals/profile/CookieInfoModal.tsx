"use client";

import { XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Cookie, Shield, Database } from "lucide-react";

interface CookieInfoModalProps {
  onClose: () => void;
}

export default function CookieInfoModal({ onClose }: CookieInfoModalProps) {
  const cookieTypes = [
    {
      title: "Необходимые cookies",
      description:
        "Обеспечивают базовую функциональность сайта, включая вход в аккаунт и сохранение товаров в корзине.",
      icon: <Shield className="w-5 h-5 text-green-400" />,
      important: true,
    },
    {
      title: "Функциональные cookies",
      description:
        "Запоминают ваши предпочтения и настройки для более удобной работы с сайтом.",
      icon: <Cookie className="w-5 h-5 text-blue-400" />,
      important: false,
    },
    {
      title: "Аналитические cookies",
      description:
        "Помогают нам понимать, как пользователи взаимодействуют с сайтом, чтобы улучшить его работу.",
      icon: <Database className="w-5 h-5 text-purple-400" />,
      important: false,
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
        className="relative z-10 w-full max-w-lg bg-primary rounded-xl shadow-xl border border-primary-border overflow-hidden max-h-[90vh] overflow-y-auto"
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Cookie className="w-6 h-6 text-blue-400" />
              Информация о файлах cookie
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-secondary-light mb-3">
              Файлы cookie — это небольшие текстовые файлы, которые хранятся в
              вашем браузере. Они помогают нам сделать ваше взаимодействие с
              сайтом более удобным и персонализированным.
            </p>
          </div>

          <div className="space-y-3 mb-5">
            {cookieTypes.map((type, index) => (
              <div
                key={index}
                className="flex gap-3 bg-gradient-from/5 p-3 rounded-lg border border-primary-border/30"
              >
                <div className="w-8 h-8 flex-shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                  {type.icon}
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm flex items-center gap-1">
                    {type.title}
                    {type.important && (
                      <span className="text-xs text-blue-400 font-normal ml-1">
                        (обязательные)
                      </span>
                    )}
                  </h3>
                  <p className="text-secondary-light text-xs">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
            <h3 className="text-white text-sm font-medium mb-1">
              Зачем мы используем cookies?
            </h3>
            <div className="text-secondary-light text-xs space-y-1">
              <p>• Для правильной работы функциональности сайта</p>
              <p>
                • Для сохранения товаров в вашей корзине и списка избранного
              </p>
              <p>• Для запоминания ваших предпочтений и настроек</p>
              <p>• Для аутентификации и обеспечения безопасности</p>
              <p>• Для анализа и улучшения работы сайта</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-primary-border">
            <p className="text-xs text-secondary-light">
              Обязательные cookies всегда активны, так как они необходимы для
              работы сайта. В настройках профиля вы можете управлять
              функциональными и аналитическими cookies.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
