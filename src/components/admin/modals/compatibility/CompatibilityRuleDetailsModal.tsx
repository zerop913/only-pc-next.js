import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Settings2, Edit, Trash2, Plus, X } from "lucide-react";

interface CompatibilityRule {
  id: number;
  name: string;
  description?: string;
  categories: Array<{
    id: number;
    primaryCategoryName: string;
    secondaryCategoryName: string;
  }>;
  characteristics: Array<{
    id: number;
    primaryCharacteristicName: string;
    secondaryCharacteristicName: string;
    comparisonType: string;
    valuesCount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CompatibilityRuleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: CompatibilityRule;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CompatibilityRuleDetailsModal({
  isOpen,
  onClose,
  rule,
  onEdit,
  onDelete,
}: CompatibilityRuleDetailsModalProps) {
  const [values, setValues] = useState<
    Record<
      number,
      Array<{ id: number; primaryValue: string; secondaryValue: string }>
    >
  >({});
  const [isLoadingValues, setIsLoadingValues] = useState(false);

  useEffect(() => {
    if (isOpen && rule) {
      fetchCompatibilityValues();
    }
  }, [isOpen, rule]);

  const fetchCompatibilityValues = async () => {
    setIsLoadingValues(true);
    try {
      const valuesData: Record<
        number,
        Array<{ id: number; primaryValue: string; secondaryValue: string }>
      > = {};

      for (const characteristic of rule.characteristics) {
        const response = await fetch(
          `/api/admin/compatibility/values?ruleCharacteristicId=${characteristic.id}`
        );
        if (response.ok) {
          const data = await response.json();
          valuesData[characteristic.id] = data;
        }
      }

      setValues(valuesData);
    } catch (error) {
      console.error("Error fetching compatibility values:", error);
    } finally {
      setIsLoadingValues(false);
    }
  };

  const getComparisonTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      exact_match: "Точное совпадение",
      compatible_values: "Совместимые значения",
      contains: "Содержит",
      greater_than_or_equal: "Больше или равно",
      greater_than_or_equal_combined: "Больше или равно (суммарно)",
      frequency_match: "Совпадение частоты",
      backward_compatible: "Обратная совместимость",
      exists: "Существует",
      greater_than_zero: "Больше нуля",
      less_than_or_equal: "Меньше или равно",
      power_sufficient: "Достаточная мощность",
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-4xl bg-primary rounded-xl shadow-xl border border-primary-border overflow-hidden max-h-[90vh]"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-primary-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/10 rounded-lg border border-blue-500/20">
              <Settings2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{rule.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-secondary-light">
                  ID: {rule.id}
                </span>
                <span className="w-1 h-1 rounded-full bg-secondary-light/50"></span>
                <span className="text-sm text-secondary-light">
                  Создано:{" "}
                  {new Date(rule.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-light hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Содержимое с прокруткой */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Описание */}
            {rule.description && (
              <div className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border">
                <h3 className="text-lg font-medium text-white mb-2">
                  Описание
                </h3>
                <p className="text-secondary-light">{rule.description}</p>
              </div>
            )}

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border">
                <div className="text-2xl font-bold text-white">
                  {rule.categories.length}
                </div>
                <div className="text-sm text-secondary-light">
                  Пар категорий
                </div>
              </div>
              <div className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border">
                <div className="text-2xl font-bold text-white">
                  {rule.characteristics.length}
                </div>
                <div className="text-sm text-secondary-light">
                  Правил характеристик
                </div>
              </div>
              <div className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border">
                <div className="text-2xl font-bold text-white">
                  {Object.values(values).reduce(
                    (acc, vals) => acc + vals.length,
                    0
                  )}
                </div>
                <div className="text-sm text-secondary-light">
                  Значений совместимости
                </div>
              </div>
            </div>

            {/* Категории */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Пары категорий
              </h3>
              {rule.categories.length > 0 ? (
                <div className="space-y-3">
                  {rule.categories.map((category, index) => (
                    <div
                      key={category.id}
                      className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">
                            {category.primaryCategoryName}
                          </span>
                          <span className="text-secondary-light">↔</span>
                          <span className="text-white font-medium">
                            {category.secondaryCategoryName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary-light">
                  <p>Пары категорий не настроены</p>
                </div>
              )}
            </div>

            {/* Характеристики */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Правила характеристик
              </h3>
              {rule.characteristics.length > 0 ? (
                <div className="space-y-4">
                  {rule.characteristics.map((characteristic) => (
                    <div
                      key={characteristic.id}
                      className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border"
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">
                            {characteristic.primaryCharacteristicName}
                          </span>
                          <span className="text-secondary-light">↔</span>
                          <span className="text-white font-medium">
                            {characteristic.secondaryCharacteristicName}
                          </span>
                        </div>
                        <div className="text-sm text-secondary-light">
                          Тип сравнения:{" "}
                          {getComparisonTypeLabel(
                            characteristic.comparisonType
                          )}
                        </div>
                      </div>

                      {/* Значения совместимости */}
                      {isLoadingValues ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                        </div>
                      ) : values[characteristic.id]?.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">
                            Значения совместимости:
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {values[characteristic.id].map((value) => (
                              <div
                                key={value.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="text-blue-400">
                                  {value.primaryValue}
                                </span>
                                <span className="text-secondary-light">→</span>
                                <span className="text-green-400">
                                  {value.secondaryValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-secondary-light">
                          Значения совместимости не настроены
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary-light">
                  <p>Правила характеристик не настроены</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="border-t border-primary-border p-6">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-secondary-light hover:text-white border border-primary-border hover:border-blue-500/30 rounded-lg transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
