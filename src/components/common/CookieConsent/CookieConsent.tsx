"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { getStandardCookie, setStandardCookie } from "@/utils/cookieUtils";
import { CookieIcon } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли уже согласие на использование куков
    const cookieConsent = getStandardCookie("cookie-consent");

    // Если согласия нет, показываем баннер через небольшую задержку
    if (!cookieConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    // Устанавливаем куку о согласии сроком на 1 год
    setStandardCookie("cookie-consent", "true", { maxAge: 365 * 24 * 60 * 60 });
    setIsVisible(false);
  };

  const declineCookies = () => {
    // Устанавливаем куку о отказе сроком на 1 месяц (чтобы не показывать баннер слишком часто)
    setStandardCookie("cookie-consent", "false", { maxAge: 30 * 24 * 60 * 60 });
    setIsVisible(false);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-x-0 bottom-5 sm:bottom-8 px-4 sm:px-6 z-50 pointer-events-none flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto max-w-7xl w-full rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.4)] backdrop-blur-lg border border-primary-border overflow-hidden"
          >
            {" "}
            <div className="relative bg-gradient-to-br from-primary to-primary-dark bg-opacity-95">
              {/* Градиентная полоса сверху */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
              <div className="p-4 sm:p-6 relative">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 max-w-full">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-gradient-to-br from-gradient-from to-gradient-to">
                    <CookieIcon className="h-6 w-6 text-blue-400" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-medium text-white mb-1">
                      Мы ценим вашу конфиденциальность
                    </h3>
                    <p className="text-sm text-gray-200">
                      OnlyPC использует файлы cookie и аналогичные технологии
                      для улучшения пользовательского опыта, анализа
                      посещаемости и персонализации контента.
                    </p>

                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-primary-border">
                            <h4 className="text-sm font-medium text-white mb-1">
                              Типы используемых файлов cookie:
                            </h4>
                            <ul className="list-disc pl-5 text-xs text-gray-300 space-y-1">
                              <li>
                                Необходимые — обеспечивают базовую
                                функциональность сайта
                              </li>
                              <li>
                                Аналитические — помогают нам понять, как вы
                                взаимодействуете с сайтом
                              </li>
                              <li>
                                Персонализация — позволяют нам запоминать ваши
                                предпочтения
                              </li>
                            </ul>
                            <p className="text-xs text-gray-400 mt-2">
                              Вы можете изменить свои настройки в любой момент в
                              разделе "Конфиденциальность" вашего профиля.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={toggleDetails}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1 flex items-center gap-1"
                    >
                      {showDetails ? "Скрыть детали" : "Подробнее"}
                      <svg
                        className={`w-3 h-3 transform transition-transform ${showDetails ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 self-end lg:self-center lg:ml-4 mt-3 lg:mt-0 shrink-0">
                    <button
                      onClick={declineCookies}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors border border-primary-border hover:border-gray-500 rounded-lg flex-shrink-0 w-full sm:w-auto"
                    >
                      Только необходимые
                    </button>
                    <button
                      onClick={acceptCookies}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all rounded-lg text-white shadow-sm hover:shadow-lg flex-shrink-0 w-full sm:w-auto"
                    >
                      Принять все
                    </button>{" "}
                    <button
                      onClick={declineCookies}
                      className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Закрыть"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
