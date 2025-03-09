import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Monitor, Cpu, Wrench, CheckCircle } from "lucide-react";

const CategoryGuide = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const steps = [
    {
      title: "Выбор комплектующих",
      description:
        "Выберите необходимые компоненты из доступных категорий. Начните с процессора и материнской платы",
      icon: Cpu,
    },
    {
      title: "Уточнение характеристик",
      description:
        "Изучите технические характеристики и выберите оптимальный вариант для ваших задач",
      icon: Monitor,
    },
    {
      title: "Проверка совместимости",
      description:
        "Система автоматически проверит совместимость всех выбранных компонентов",
      icon: Wrench,
    },
    {
      title: "Завершение сборки",
      description:
        "После выбора всех компонентов вы сможете сохранить или заказать готовую сборку",
      icon: CheckCircle,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative flex w-full md:w-auto">
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="w-full md:w-auto flex items-center gap-2 px-3 py-2 bg-gradient-from/20 rounded-lg text-secondary-light group transition-all duration-300 hover:bg-gradient-from/30 border border-primary-border"
        whileTap={{ scale: 0.98 }}
      >
        <QuestionMarkCircleIcon className="w-5 h-5 group-hover:text-white transition-colors duration-300" />
        <span className="text-sm font-medium group-hover:text-white transition-colors duration-300">
          Как собрать ПК
        </span>
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              className="relative z-10 w-full max-w-lg bg-primary rounded-xl p-6 shadow-xl border border-primary-border overflow-y-auto max-h-[90vh]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Руководство по сборке ПК
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-secondary-light hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="flex gap-4 p-4 bg-gradient-from/20 rounded-lg border border-primary-border group/item hover:bg-gradient-from/30 transition-all duration-300"
                    >
                      <div className="flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-2">
                          {step.title}
                        </h4>
                        <p className="text-secondary-light text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryGuide;
