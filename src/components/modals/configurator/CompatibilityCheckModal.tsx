"use client";

import { useState } from "react";
import {
  XMarkIcon,
  CheckIcon,
  XMarkIcon as XIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { CompatibilityResult, CompatibilityEdge } from "@/types/compatibility";
import Button from "@/components/common/Button/Button";

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CompatibilityResult;
}

interface ProductCharacteristic {
  type: string;
  value: string;
}

interface ProductDetails {
  id: number;
  title: string;
  characteristics: ProductCharacteristic[];
}

interface CompatibilityDetails {
  primaryProduct: ProductDetails;
  secondaryProduct: ProductDetails;
  matchingCharacteristics: {
    type: string;
    primaryValue: string;
    secondaryValue: string;
  }[];
  incompatibleCharacteristics?: {
    type: string;
    primaryValue: string;
    secondaryValue: string;
    reason: string;
  }[];
}

export default function CompatibilityCheckModal({
  isOpen,
  onClose,
  results,
}: CompatibilityModalProps) {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedPair, setSelectedPair] = useState<CompatibilityEdge | null>(
    null
  );
  const [compatibilityDetails, setCompatibilityDetails] =
    useState<CompatibilityDetails | null>(null);
  const [showAllCompatible, setShowAllCompatible] = useState(false);
  const [activeTab, setActiveTab] = useState<"issues" | "compatible">(
    results?.issues?.length > 0 ? "issues" : "compatible"
  );

  if (!isOpen) return null;

  // Фильтруем реальные проблемы совместимости, исключая ошибки отсутствующих компонентов
  const filteredIssues =
    results?.issues?.filter(
      (issue) => issue.components.length > 1 || issue.components[0].id !== 0
    ) || [];

  // Создаем результаты без ошибок отсутствующих компонентов
  const filteredResults = {
    ...results,
    compatible: results?.compatible || filteredIssues.length === 0,
    issues: filteredIssues,
  };

  // Подсчет совместимых и несовместимых пар
  const compatiblePairs =
    filteredResults?.componentPairs?.filter((pair) => pair.compatible) || [];

  const incompatiblePairs =
    filteredResults?.componentPairs?.filter((pair) => !pair.compatible) || [];

  // Функция для получения деталей совместимости
  const fetchCompatibilityDetails = async (pair: CompatibilityEdge) => {
    setLoadingDetails(true);
    setSelectedPair(pair);

    try {
      const response = await fetch(
        `/api/compatibility/details?primary=${pair.source.id}&secondary=${pair.target.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setCompatibilityDetails(data);
      } else {
        console.error("Ошибка при получении данных:", response.statusText);
      }
    } catch (error) {
      console.error("Ошибка при получении деталей совместимости:", error);
    } finally {
      setLoadingDetails(false);
      setDetailsModalOpen(true);
    }
  };

  // Функция для определения серьезности проблемы несовместимости
  const getIncompatibilitySeverity = (
    reason: string | null
  ): "critical" | "warning" | "info" => {
    if (!reason) return "info";

    const criticalKeywords = [
      "сокет",
      "форм-фактор",
      "тип памяти",
      "недостаточно мощности",
    ];
    const warningKeywords = [
      "частота",
      "количество",
      "TDP",
      "объем",
      "не оптимально",
    ];

    if (
      criticalKeywords.some((keyword) => reason.toLowerCase().includes(keyword))
    ) {
      return "critical";
    } else if (
      warningKeywords.some((keyword) => reason.toLowerCase().includes(keyword))
    ) {
      return "warning";
    }

    return "info";
  };

  // Функция для получения метки серьезности проблемы
  const getIncompatibilityLabel = (
    severity: "critical" | "warning" | "info"
  ): string => {
    switch (severity) {
      case "critical":
        return "Критическая ошибка";
      case "warning":
        return "Предупреждение";
      case "info":
        return "Информация";
    }
  };

  // Функция для получения цвета в зависимости от серьезности
  const getSeverityColorClass = (
    severity: "critical" | "warning" | "info"
  ): { bg: string; border: string; text: string; icon: React.ReactNode } => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-400",
          icon: <XIcon className="w-5 h-5 text-red-400" />,
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          text: "text-yellow-400",
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />,
        };
      case "info":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-400",
          icon: <InformationCircleIcon className="w-5 h-5 text-blue-400" />,
        };
    }
  };

  // Компонент карточки для отображения пары компонентов
  const ComponentPairCard = ({
    pair,
    isCompatible,
  }: {
    pair: CompatibilityEdge;
    isCompatible: boolean;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const severity = isCompatible
      ? "info"
      : getIncompatibilitySeverity(pair.reason);
    const { bg, border, text, icon } = isCompatible
      ? {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          text: "text-green-400",
          icon: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
        }
      : getSeverityColorClass(severity);

    // Определяем, нужно ли показывать стрелочку (только для несовместимых и с причиной)
    const shouldShowExpandButton = !isCompatible && !!pair.reason;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg border ${border} ${bg} transition-all duration-200 overflow-hidden hover:shadow-md hover:border-opacity-80`}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {isCompatible ? (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center`}
                  >
                    {icon}
                  </div>
                )}
                <span
                  className={`text-base font-medium ${
                    isCompatible ? "text-green-400" : text
                  }`}
                >
                  {isCompatible
                    ? "Совместимо"
                    : getIncompatibilityLabel(severity)}
                </span>
              </div>
              <div className="flex flex-col space-y-2.5 pl-8">
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-sm text-secondary-light truncate">
                    {pair.source.categoryName}:
                  </span>
                  <span
                    className="text-sm text-white font-medium truncate"
                    title={pair.source.title}
                  >
                    {pair.source.title}
                  </span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-sm text-secondary-light truncate">
                    {pair.target.categoryName}:
                  </span>
                  <span
                    className="text-sm text-white font-medium truncate"
                    title={pair.target.title}
                  >
                    {pair.target.title}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              {shouldShowExpandButton && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={`w-8 h-8 rounded-full border border-primary-border hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 transition-all flex items-center justify-center`}
                  title={expanded ? "Свернуть" : "Развернуть"}
                >
                  {expanded ? (
                    <ChevronUpIcon className={`w-5 h-5 text-white`} />
                  ) : (
                    <ChevronDownIcon className={`w-5 h-5 text-white`} />
                  )}
                </button>
              )}
              <button
                onClick={() => fetchCompatibilityDetails(pair)}
                className="w-8 h-8 rounded-full border border-primary-border hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 transition-all flex items-center justify-center"
                title="Подробная информация"
              >
                <InformationCircleIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Используем AnimatePresence для плавной анимации */}
          <AnimatePresence initial={false}>
            {expanded && !isCompatible && pair.reason && (
              <motion.div
                key="content"
                initial={{
                  opacity: 0,
                  height: 0,
                  marginTop: 0,
                  marginBottom: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  marginTop: 8,
                  marginBottom: 4,
                  transition: {
                    duration: 0.15,
                    ease: [0.4, 0.0, 0.2, 1], // Smooth ease-out curve
                  },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginTop: 0,
                  marginBottom: 0,
                  transition: {
                    duration: 0.15, // Используем такую же длительность как при открытии
                    ease: [0.4, 0.0, 0.2, 1], // Используем такую же кривую как при открытии для более плавного закрытия
                  },
                }}
                className={`${bg} rounded border ${border} ml-8 overflow-hidden`}
              >
                <div className="p-3">
                  <p className={`text-sm text-white`}>{pair.reason}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Компонент модального окна с деталями
  const DetailsModal = () => {
    if (!detailsModalOpen || !selectedPair || !compatibilityDetails)
      return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setDetailsModalOpen(false)}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-[201] w-full max-w-2xl max-h-[90vh] bg-primary rounded-lg border border-primary-border shadow-xl flex flex-col overflow-hidden"
        >
          <div className="sticky top-0 z-10 p-4 border-b border-primary-border flex justify-between items-center bg-primary shrink-0 bg-gradient-to-r from-gradient-from/30 to-primary">
            <div className="flex items-center">
              {selectedPair.compatible ? (
                <div className="mr-2 w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                </div>
              ) : (
                <div className="mr-2 w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XIcon className="w-5 h-5 text-red-400" />
                </div>
              )}
              <h3 className="text-lg font-medium text-white">
                {selectedPair.compatible
                  ? "Информация о совместимости"
                  : "Проблема совместимости"}
              </h3>
            </div>
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white border border-primary-border hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            {/* Сводка о статусе совместимости */}
            <div
              className={`mb-5 rounded-lg border p-4 ${
                selectedPair.compatible
                  ? "border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-500/10"
                  : "border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-500/10"
              }`}
            >
              <div className="flex items-start">
                {selectedPair.compatible ? (
                  <ShieldCheckIcon className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <ExclamationCircleIcon className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-white">
                  {selectedPair.compatible
                    ? "Эти компоненты полностью совместимы и будут работать вместе без проблем."
                    : selectedPair.reason}
                </p>
              </div>
            </div>

            {/* Информация о продуктах */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="p-4 bg-gradient-to-br from-gradient-from/5 to-transparent rounded-lg border border-primary-border transition-all hover:border-blue-500/30">
                <div className="text-white font-medium mb-1.5 text-base">
                  {compatibilityDetails.primaryProduct.title}
                </div>
                <div className="text-xs text-secondary-light uppercase tracking-wider mb-3">
                  {selectedPair.source.categoryName}
                </div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {compatibilityDetails.primaryProduct.characteristics
                    .filter(
                      (char) =>
                        compatibilityDetails.matchingCharacteristics.some(
                          (mc) => mc.type === char.type
                        ) ||
                        compatibilityDetails.incompatibleCharacteristics?.some(
                          (ic) => ic.type === char.type
                        )
                    )
                    .map((char, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm mb-1.5 pb-1.5 border-b border-primary-border/30 last:border-0 last:pb-0 last:mb-0"
                      >
                        <span className="text-secondary-light mr-2 truncate max-w-[50%]">
                          {char.type}:
                        </span>
                        <span className="text-white text-right">
                          {char.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-gradient-from/5 to-transparent rounded-lg border border-primary-border transition-all hover:border-blue-500/30">
                <div className="text-white font-medium mb-1.5 text-base">
                  {compatibilityDetails.secondaryProduct.title}
                </div>
                <div className="text-xs text-secondary-light uppercase tracking-wider mb-3">
                  {selectedPair.target.categoryName}
                </div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {compatibilityDetails.secondaryProduct.characteristics
                    .filter(
                      (char) =>
                        compatibilityDetails.matchingCharacteristics.some(
                          (mc) => mc.type === char.type
                        ) ||
                        compatibilityDetails.incompatibleCharacteristics?.some(
                          (ic) => ic.type === char.type
                        )
                    )
                    .map((char, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm mb-1.5 pb-1.5 border-b border-primary-border/30 last:border-0 last:pb-0 last:mb-0"
                      >
                        <span className="text-secondary-light mr-2 truncate max-w-[50%]">
                          {char.type}:
                        </span>
                        <span className="text-white text-right">
                          {char.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Сравнительная таблица характеристик */}
            <div className="rounded-lg border border-primary-border overflow-hidden mb-5">
              <div className="p-3 bg-gradient-to-r from-gradient-from/30 to-transparent border-b border-primary-border">
                <h4 className="text-base font-medium text-white">
                  Сравнение характеристик
                </h4>
              </div>
              <div className="divide-y divide-primary-border">
                {/* Совместимые характеристики */}
                {compatibilityDetails.matchingCharacteristics.map(
                  (char, index) => (
                    <motion.div
                      key={`match-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-green-500/5 border-l-2 border-green-400"
                    >
                      <div className="flex items-center mb-2">
                        <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-green-400 text-sm font-medium">
                          {char.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <span className="text-xs text-secondary-light min-w-[80px]">
                            {selectedPair.source.categoryName}:
                          </span>
                          <span className="ml-2 text-sm text-white">
                            {char.primaryValue}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-secondary-light min-w-[80px]">
                            {selectedPair.target.categoryName}:
                          </span>
                          <span className="ml-2 text-sm text-white">
                            {char.secondaryValue}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                )}

                {/* Несовместимые характеристики */}
                {compatibilityDetails.incompatibleCharacteristics?.map(
                  (char, index) => {
                    // Специальная обработка для размеров корпуса и материнской платы
                    const isCaseMoboSize =
                      compatibilityDetails.primaryProduct.title
                        .toLowerCase()
                        .includes("корпус") &&
                      compatibilityDetails.secondaryProduct.title
                        .toLowerCase()
                        .includes("материнская плата") &&
                      (char.type.toLowerCase().includes("высота") ||
                        char.type.toLowerCase().includes("ширина") ||
                        char.type.toLowerCase().includes("глубина"));

                    const specialCaseMessage = isCaseMoboSize
                      ? "Размеры корпуса больше размеров материнской платы, что корректно"
                      : null;

                    return (
                      <motion.div
                        key={`incompatible-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 ${
                          isCaseMoboSize
                            ? "bg-green-500/5 border-l-2 border-green-400"
                            : "bg-red-500/5 border-l-2 border-red-400"
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {isCaseMoboSize ? (
                            <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                          ) : (
                            <XIcon className="w-4 h-4 text-red-400 mr-2" />
                          )}
                          <span
                            className={`${
                              isCaseMoboSize ? "text-green-400" : "text-red-400"
                            } text-sm font-medium`}
                          >
                            {char.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <span className="text-xs text-secondary-light min-w-[80px]">
                              {selectedPair.source.categoryName}:
                            </span>
                            <span className="ml-2 text-sm text-white">
                              {char.primaryValue}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-secondary-light min-w-[80px]">
                              {selectedPair.target.categoryName}:
                            </span>
                            <span className="ml-2 text-sm text-white">
                              {char.secondaryValue}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`mt-2 text-sm ${
                            isCaseMoboSize ? "text-green-400" : "text-white"
                          }`}
                        >
                          {specialCaseMessage || char.reason}
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-primary-border bg-primary shrink-0">
            <Button
              onClick={() => setDetailsModalOpen(false)}
              className="px-4 py-2.5 bg-primary border border-primary-border hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 text-white rounded-lg text-base"
            >
              Закрыть
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Определение, сколько совместимых пар показывать в режиме свернутого отображения
  const initialCompatibleToShow = 3;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative z-[151] w-full max-w-2xl max-h-[90vh] bg-primary rounded-lg border border-primary-border shadow-xl flex flex-col overflow-hidden"
      >
        {/* Заголовок модального окна */}
        <div className="sticky top-0 z-10 p-4 border-b border-primary-border flex justify-between items-center bg-gradient-to-r from-gradient-from/30 to-primary shrink-0">
          <div className="flex items-center">
            {filteredResults.compatible ? (
              <div className="mr-3 w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-green-400" />
              </div>
            ) : (
              <div className="mr-3 w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
              </div>
            )}
            <h3 className="text-lg font-medium text-white">
              Проверка совместимости
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-primary-border hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 transition-all"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Содержимое модального окна */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Карточка с результатом */}
          <div className="p-4">
            <div
              className={`mb-5 rounded-lg border p-4 ${
                filteredResults.compatible
                  ? "border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-500/10"
                  : "border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-500/10"
              }`}
            >
              <div className="flex items-start">
                {filteredResults.compatible ? (
                  <ShieldCheckIcon className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <ExclamationCircleIcon className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4
                    className={`text-lg font-medium mb-1 ${
                      filteredResults.compatible
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {filteredResults.compatible
                      ? "Все компоненты совместимы"
                      : "Обнаружены проблемы совместимости"}
                  </h4>
                  <p className="text-sm text-white">
                    {filteredResults.compatible
                      ? "Все выбранные компоненты будут корректно работать вместе и обеспечат стабильную работу системы."
                      : "Некоторые компоненты несовместимы между собой. Рекомендуется заменить эти компоненты для обеспечения стабильной работы системы."}
                  </p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3.5 rounded-lg border border-primary-border bg-gradient-to-br from-green-500/5 to-transparent flex justify-between items-center hover:border-green-500/30 transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 mr-3 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-sm text-white">Совместимые пары</span>
                </div>
                <span className="text-xl font-semibold text-white">
                  {compatiblePairs.length}
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-3.5 rounded-lg border border-primary-border bg-gradient-to-br from-red-500/5 to-transparent flex justify-between items-center hover:border-red-500/30 transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 mr-3 flex items-center justify-center">
                    <XIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm text-white">Несовместимые пары</span>
                </div>
                <span className="text-xl font-semibold text-white">
                  {incompatiblePairs.length}
                </span>
              </motion.div>
            </div>

            {/* Табы для переключения между проблемами и совместимыми компонентами */}
            <div className="mb-4 border-b border-primary-border">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ y: -1 }}
                  onClick={() => setActiveTab("issues")}
                  className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
                    activeTab === "issues"
                      ? "text-white"
                      : "text-secondary-light hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1.5" />
                    Проблемы
                    {incompatiblePairs.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1">
                        {incompatiblePairs.length}
                      </span>
                    )}
                  </div>
                  {activeTab === "issues" && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-from"
                      initial={false}
                    />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  onClick={() => setActiveTab("compatible")}
                  className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
                    activeTab === "compatible"
                      ? "text-white"
                      : "text-secondary-light hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    <CheckIcon className="w-4 h-4 mr-1.5" />
                    Совместимые
                    {compatiblePairs.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center bg-green-500 text-white text-xs rounded-full h-5 min-w-5 px-1">
                        {compatiblePairs.length}
                      </span>
                    )}
                  </div>
                  {activeTab === "compatible" && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-from"
                      initial={false}
                    />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Список компонентов */}
          <div className="overflow-y-auto custom-scrollbar px-4 pb-4 flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "issues" && (
                <motion.div
                  key="issues"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {incompatiblePairs.length > 0 ? (
                    incompatiblePairs.map((pair, index) => (
                      <ComponentPairCard
                        key={`incompatible-${index}`}
                        pair={pair}
                        isCompatible={false}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
                      >
                        <CheckCircleIcon className="w-10 h-10 text-green-400" />
                      </motion.div>
                      <p className="text-green-400 text-lg font-medium mb-2">
                        Проблем совместимости не обнаружено
                      </p>
                      <p className="text-white text-sm max-w-md mx-auto">
                        Все компоненты в вашей сборке совместимы друг с другом и
                        будут работать без проблем.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "compatible" && (
                <motion.div
                  key="compatible"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {compatiblePairs.length > 0 ? (
                    (showAllCompatible
                      ? compatiblePairs
                      : compatiblePairs.slice(0, initialCompatibleToShow)
                    ).map((pair, index) => (
                      <ComponentPairCard
                        key={`compatible-${index}`}
                        pair={pair}
                        isCompatible={true}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4"
                      >
                        <ExclamationTriangleIcon className="w-10 h-10 text-yellow-400" />
                      </motion.div>
                      <p className="text-yellow-400 text-lg font-medium mb-2">
                        Совместимых пар не найдено
                      </p>
                      <p className="text-white text-sm max-w-md mx-auto">
                        В вашей конфигурации не обнаружено совместимых
                        комбинаций компонентов.
                      </p>
                    </div>
                  )}

                  {/* Кнопка "Показать больше" */}
                  {compatiblePairs.length > initialCompatibleToShow && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => setShowAllCompatible(!showAllCompatible)}
                      className="w-full py-2.5 px-4 text-sm flex items-center justify-center gap-1.5 border border-primary-border rounded-lg hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 transition-all"
                    >
                      {showAllCompatible ? (
                        <>
                          <ChevronUpIcon className="w-4 h-4 text-white" />
                          <span className="text-white">Показать меньше</span>
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="w-4 h-4 text-white" />
                          <span className="text-white">
                            Показать все ({compatiblePairs.length} пар)
                          </span>
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Нижняя часть с кнопкой закрытия */}
        <div className="p-4 border-t border-primary-border bg-primary shrink-0">
          <Button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-primary border border-primary-border hover:bg-gradient-to-b hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/30 text-white rounded-lg text-base justify-center transition-all"
          >
            Закрыть
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>{detailsModalOpen && <DetailsModal />}</AnimatePresence>
    </div>
  );
}
