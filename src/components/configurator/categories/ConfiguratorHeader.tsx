"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChartBarIcon,
  CheckIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import CategoryGuide from "./CategoryGuide";
import TotalPrice from "../../TotalPrice/TotalPrice";
import { useConfigurator } from "@/contexts/ConfiguratorContext";
import { useModal } from "@/contexts/ModalContext";
import { Tooltip } from "@/components/common/Tooltip";
import { CompatibilityEdge } from "@/types/compatibility";

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
    openCompatibilityCheckModal,
  } = useConfigurator();

  // Состояние для хранения результатов совместимости
  const [compatibilityPercentage, setCompatibilityPercentage] = useState(100);
  const [incompatibleCount, setIncompatibleCount] = useState(0);
  const [isCompatible, setIsCompatible] = useState(true);
  const [tooltipText, setTooltipText] = useState("");

  // Обновляем информацию о совместимости при изменении выбранных продуктов
  useEffect(() => {
    if (selectedProducts.length < 2) {
      // Если выбрано меньше 2 продуктов, считаем что все совместимо
      setCompatibilityPercentage(100);
      setIncompatibleCount(0);
      setIsCompatible(true);
      setTooltipText("Выберите больше компонентов для проверки совместимости");
      return;
    }

    // Делаем запрос к API для проверки совместимости
    const checkCompatibility = async () => {
      try {
        // Подготавливаем данные для запроса
        const componentsData = selectedProducts
          .map((item) => ({
            categorySlug:
              categories.find((c) => c.id === item.categoryId)?.slug || "",
            productSlug: item.product.slug,
          }))
          .filter((item) => item.categorySlug !== "");

        // Если нет данных для проверки, выходим
        if (componentsData.length < 2) return;

        // Отправляем запрос
        const response = await fetch("/api/compatibility/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ components: componentsData }),
        });

        if (response.ok) {
          const data = await response.json();

          // Получаем количество несовместимых пар
          const incompatiblePairs =
            data.componentPairs?.filter(
              (pair: CompatibilityEdge) => !pair.compatible
            ) || [];

          const totalIssues = incompatiblePairs.length;

          // Рассчитываем процент совместимости
          // Максимальное количество пар: n*(n-1)/2, где n - количество компонентов
          const maxPairs =
            (selectedProducts.length * (selectedProducts.length - 1)) / 2;
          const compatPercentage =
            maxPairs > 0
              ? Math.round(((maxPairs - totalIssues) / maxPairs) * 100)
              : 100;

          setCompatibilityPercentage(compatPercentage);
          setIncompatibleCount(totalIssues);
          setIsCompatible(data.compatible);

          if (totalIssues > 0) {
            setTooltipText(
              `${totalIssues} ${getWordEnding(
                totalIssues,
                "несовместимость",
                "несовместимости",
                "несовместимостей"
              )} между компонентами`
            );
          } else {
            setTooltipText("Все компоненты совместимы");
          }
        }
      } catch (error) {
        console.error("Ошибка при проверке совместимости:", error);
        setCompatibilityPercentage(100);
        setIncompatibleCount(0);
      }
    };

    // Запускаем проверку совместимости
    checkCompatibility();
  }, [selectedProducts, categories]);

  // Вспомогательная функция для правильного окончания слов
  const getWordEnding = (
    count: number,
    one: string,
    few: string,
    many: string
  ): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return many;
    }

    if (lastDigit === 1) {
      return one;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return few;
    }

    return many;
  };

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
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto scrollbar-thin scrollbar-thumb-primary-border scrollbar-track-transparent">
            <motion.button
              onClick={handleOpenModal}
              className="flex-none flex items-center gap-2 px-3 py-2 bg-gradient-from/20 rounded-lg text-secondary-light group transition-all duration-300 hover:bg-gradient-from/30 border border-primary-border whitespace-nowrap"
              whileTap={{ scale: 0.98 }}
            >
              <ChartBarIcon className="w-5 h-5 group-hover:text-white transition-colors duration-300" />
              <span className="text-sm font-medium group-hover:text-white transition-colors duration-300">
                Компоненты: {completedComponents}/{totalComponents}
              </span>
            </motion.button>

            <Tooltip content={tooltipText} position="bottom">
              <motion.div
                className={`flex-none flex items-center gap-2 px-3 py-2 bg-gradient-from/20 rounded-lg text-secondary-light border border-primary-border cursor-pointer relative whitespace-nowrap ${
                  !isCompatible
                    ? "hover:bg-red-900/20"
                    : "hover:bg-green-900/20"
                }`}
              >
                {!isCompatible && (
                  <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm font-medium">
                  Совместимость:{" "}
                  <span
                    className={`${
                      isCompatible ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {compatibilityPercentage}%
                  </span>
                </span>
              </motion.div>
            </Tooltip>

            {/* Кнопка проверки совместимости */}
            <motion.button
              onClick={openCompatibilityCheckModal}
              className="flex-none flex items-center gap-2 px-3 py-2 bg-gradient-from/20 rounded-lg text-secondary-light group transition-all duration-300 hover:bg-gradient-from/30 border border-primary-border whitespace-nowrap"
              whileTap={{ scale: 0.98 }}
            >
              <CheckBadgeIcon className="w-5 h-5 group-hover:text-white transition-colors duration-300" />
              <span className="text-sm font-medium group-hover:text-white transition-colors duration-300">
                Проверка
              </span>
            </motion.button>
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
