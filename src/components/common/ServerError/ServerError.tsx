"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeIcon, Undo2, RefreshCw, Server } from "lucide-react";
import { useEffect } from "react";

interface ServerErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

export default function ServerError({
  statusCode = 500,
  err,
}: ServerErrorProps) {
  const router = useRouter();

  useEffect(() => {
    document.title = `Ошибка ${statusCode} - OnlyPC`;
    if (err) {
      console.error("Server Error:", err);
    }
  }, [statusCode, err]);

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

  const getErrorMessage = (code: number) => {
    switch (code) {
      case 500:
        return {
          title: "Внутренняя ошибка сервера",
          description:
            "Произошла ошибка на сервере. Мы уже работаем над её устранением.",
        };
      case 502:
        return {
          title: "Сервер недоступен",
          description:
            "Сервер временно недоступен. Попробуйте обновить страницу через несколько минут.",
        };
      case 503:
        return {
          title: "Сервис недоступен",
          description: "Сервис временно недоступен из-за технических работ.",
        };
      case 504:
        return {
          title: "Превышено время ожидания",
          description: "Сервер не отвечает. Попробуйте обновить страницу.",
        };
      default:
        return {
          title: "Ошибка сервера",
          description: "Произошла неизвестная ошибка сервера.",
        };
    }
  };

  const errorInfo = getErrorMessage(statusCode);
  const statusString = statusCode.toString();

  return (
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
        {/* Иконка сервера */}
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div variants={iconPulseVariants} animate="animate">
              <Server className="w-16 h-16 text-red-400" />
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

        {/* Анимированный код ошибки */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {statusString.split("").map((digit, i) => (
            <motion.div
              key={i}
              variants={numberVariants}
              initial="initial"
              animate="animate"
              custom={i}
              className="relative"
            >
              <div className="text-[120px] leading-none font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white/80 to-white/20">
                {digit}
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
          <h2 className="text-2xl text-white font-medium">{errorInfo.title}</h2>
          <p className="text-secondary-light/80 max-w-md mx-auto">
            {errorInfo.description}
          </p>
          {process.env.NODE_ENV === "development" && err?.message && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-w-md mx-auto">
              <p className="text-red-400 text-sm font-mono">{err.message}</p>
            </div>
          )}
        </motion.div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-500/10 
                     hover:bg-red-500/20 border border-red-500/30
                     text-red-400 hover:text-red-300 transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" />
              <span>Обновить страницу</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            onClick={() => router.back()}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-from/10 
                     hover:bg-gradient-from/20 border border-primary-border
                     text-secondary-light hover:text-white transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <Undo2 className="w-5 h-5" />
              <span>Вернуться назад</span>
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
  );
}
