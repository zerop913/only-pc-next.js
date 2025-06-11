"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HomeIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    document.title = PAGE_TITLES.SERVER_ERROR;
    // Логирование критической ошибки
    console.error("Global Error:", error);
  }, [error]);

  const glowVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: {
      scale: [0.95, 1.05, 0.95],
      opacity: [0, 0.4, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const numberVariants = {
    initial: { rotateY: -90, opacity: 0 },
    animate: (i: number) => ({
      rotateY: 0,
      opacity: 1,
      transition: {
        delay: i * 0.2,
        type: "spring",
        stiffness: 100,
      },
    }),
  };
  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    },
  };

  const iconPulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <html lang="ru">
      <body className="min-h-screen bg-primary-dark">
        <div className="fixed inset-0 flex items-center justify-center bg-primary-dark overflow-hidden">
          {/* Анимированный фон */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              variants={glowVariants}
              initial="initial"
              animate="animate"
            >
              <div className="w-full h-full bg-gradient-to-br from-red-500/2 via-orange-500/2 to-red-500/2 rounded-full blur-[120px]" />
            </motion.div>
          </div>

          <div className="relative z-10 text-center">
            {" "}
            {/* Иконка предупреждения */}
            <motion.div
              variants={iconVariants}
              initial="initial"
              animate="animate"
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <motion.div variants={iconPulseVariants} animate="animate">
                  <AlertTriangle className="w-16 h-16 text-red-400" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
            {/* Анимированное 500 */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[5, 0, 0].map((number, i) => (
                <motion.div
                  key={i}
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  custom={i}
                  className="relative"
                >
                  <div className="text-[120px] leading-none font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white/80 to-white/20">
                    {number}
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-red-500/20 via-orange-500/20 to-transparent blur-2xl opacity-50"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              ))}
            </div>
            {/* Текст */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4 mb-12"
            >
              <h2 className="text-2xl text-white font-medium">
                Критическая ошибка сервера
              </h2>
              <p className="text-secondary-light/80 max-w-md mx-auto">
                Произошла серьёзная ошибка в работе приложения. Пожалуйста,
                перезагрузите страницу или обратитесь в поддержку.
              </p>
              {process.env.NODE_ENV === "development" && error.message && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-w-md mx-auto">
                  <p className="text-red-400 text-sm font-mono">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-red-400/60 text-xs font-mono mt-1">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                onClick={() => reset()}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-500/10 
                         hover:bg-red-500/20 border border-red-500/30
                         text-red-400 hover:text-red-300 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Перезагрузить</span>
                </div>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Link
                  href="/"
                  className="block w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-500/10 
                           hover:bg-blue-500/20 border border-blue-500/30
                           text-blue-400 hover:text-blue-300 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-2">
                    <HomeIcon className="w-5 h-5" />
                    <span>На главную</span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
