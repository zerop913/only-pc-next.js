"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeIcon, Undo2 } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const glowVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: {
      scale: [0.95, 1.05, 0.95],
      opacity: [0, 0.3, 0],
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
          <div className="w-full h-full bg-gradient-to-br from-blue-500/2 via-purple-500/2 to-blue-500/2 rounded-full blur-[120px]" />
        </motion.div>
      </div>

      <div className="relative z-10 text-center">
        {/* Анимированное 404 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[4, 0, 4].map((number, i) => (
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
                className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-transparent blur-2xl opacity-50"
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
            Похоже, вы заблудились
          </h2>
          <p className="text-secondary-light/80 max-w-md mx-auto">
            Страница, которую вы ищете, не существует или была перемещена
          </p>
        </motion.div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
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
