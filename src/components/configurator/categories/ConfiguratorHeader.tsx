"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import CategoryGuide from "./CategoryGuide";
import TotalPrice from "../../TotalPrice/TotalPrice";

interface BuildProgress {
  category: string;
  isCompleted: boolean;
  component?: string;
}

const ConfiguratorHeader = ({ totalPrice = 0 }) => {
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const buildProgress: BuildProgress[] = [
    {
      category: "Процессор",
      isCompleted: true,
      component: "Intel Core i5-12400F",
    },
    {
      category: "Материнская плата",
      isCompleted: true,
      component: "MSI PRO B660M-A",
    },
    { category: "Оперативная память", isCompleted: false },
    { category: "Видеокарта", isCompleted: false },
    { category: "Накопитель", isCompleted: false },
    { category: "Блок питания", isCompleted: false },
    { category: "Корпус", isCompleted: false },
    { category: "Охлаждение", isCompleted: false },
  ];

  const completedComponents = buildProgress.filter(
    (item) => item.isCompleted
  ).length;
  const totalComponents = buildProgress.length;
  const compatibilityScore = 100;

  return (
    <div className="flex flex-col gap-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Конфигуратор ПК
          </h1>
          <div className="md:hidden">
            <TotalPrice total={totalPrice} />
          </div>
        </div>
        <div className="hidden md:block">
          <TotalPrice total={totalPrice} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto">
            <motion.button
              onClick={() => setIsProgressModalOpen(true)}
              className="flex-1 md:flex-none flex items-center gap-2 px-3 py-2 bg-gradient-from/20 rounded-lg text-secondary-light group transition-all duration-300 hover:bg-gradient-from/30 border border-primary-border"
              whileTap={{ scale: 0.98 }}
            >
              <ChartBarIcon className="w-5 h-5 group-hover:text-white transition-colors duration-300" />
              <span className="text-sm font-medium group-hover:text-white transition-colors duration-300">
                Компоненты: {completedComponents}/{totalComponents}
              </span>
            </motion.button>

            <motion.div className="flex-1 md:flex-none flex items-center gap-2 px-3 py-2 bg-gradient-from/20 rounded-lg text-secondary-light border border-primary-border cursor-pointer">
              <span className="text-sm font-medium">
                Совместимость:{" "}
                <span className="text-green-400">{compatibilityScore}%</span>
              </span>
            </motion.div>
          </div>
          <div className="mt-2 md:hidden w-full">
            <CategoryGuide />
          </div>
        </div>
        <div className="hidden md:block">
          <CategoryGuide />
        </div>
      </div>

      <AnimatePresence>
        {isProgressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProgressModalOpen(false)}
            />

            <motion.div
              className="relative z-10 w-full max-w-2xl bg-primary rounded-xl p-6 shadow-xl border border-primary-border"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Прогресс сборки
                </h2>
                <button
                  onClick={() => setIsProgressModalOpen(false)}
                  className="text-secondary-light hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {buildProgress.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-from/20 rounded-lg border border-primary-border"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.isCompleted
                              ? "bg-green-400"
                              : "bg-secondary-light"
                          }`}
                        />
                        <span className="text-white font-medium">
                          {item.category}
                        </span>
                      </div>
                      {item.component && (
                        <span className="text-secondary-light text-sm">
                          {item.component}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-primary-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary-light">Общий прогресс</span>
                  <span className="text-white">
                    {((completedComponents / totalComponents) * 100).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="h-2 bg-gradient-from/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${
                        (completedComponents / totalComponents) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConfiguratorHeader;
