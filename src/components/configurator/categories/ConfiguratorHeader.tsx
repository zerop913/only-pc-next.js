"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChartBarIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import CategoryGuide from "./CategoryGuide";
import TotalPrice from "../../TotalPrice/TotalPrice";
import { useConfigurator } from "@/contexts/ConfiguratorContext";
import { useModal } from "@/contexts/ModalContext";

interface ConfiguratorHeaderProps {
  editingBuildName?: string | null;
  editingBuildSlug?: string | null;
}

const ConfiguratorHeader = ({
  editingBuildName,
  editingBuildSlug,
}: ConfiguratorHeaderProps) => {
  const { openConfigurationModal, closeConfigurationModal } = useModal();
  const {
    selectedProducts,
    categories,
    getTotalPrice,
    getProgress,
    isLoading,
    isConfigurationComplete,
  } = useConfigurator();

  const completedComponents = selectedProducts.length;
  const totalComponents = categories.length;
  const progress = getProgress();

  const handleOpenModal = () => {
    openConfigurationModal({
      categories,
      selectedProducts,
      progress,
      isComplete: isConfigurationComplete,
      onClose: closeConfigurationModal,
      editingBuildName,
      editingBuildSlug,
    });
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="flex flex-col gap-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Конфигуратор ПК
          </h1>
          <div className="md:hidden">
            <TotalPrice total={getTotalPrice()} />
          </div>
        </div>
        <div className="hidden md:block">
          <TotalPrice total={getTotalPrice()} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto">
            <motion.button
              onClick={handleOpenModal}
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
                <span className="text-green-400">{progress.toFixed(0)}%</span>
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
    </div>
  );
};

export default ConfiguratorHeader;
