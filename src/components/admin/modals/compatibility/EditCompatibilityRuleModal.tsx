import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Plus, Trash2, Save } from "lucide-react";
import Select from "@/components/common/ui/Select";

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

interface EditCompatibilityRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: CompatibilityRule;
  onSuccess: () => void;
}

interface Category {
  id: number;
  name: string;
}

interface CharacteristicType {
  id: number;
  name: string;
}

export default function EditCompatibilityRuleModal({
  isOpen,
  onClose,
  rule,
  onSuccess,
}: EditCompatibilityRuleModalProps) {
  const [formData, setFormData] = useState({
    name: rule.name,
    description: rule.description || "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [characteristicTypes, setCharacteristicTypes] = useState<
    CharacteristicType[]
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<
    Array<{
      id?: number;
      primaryCategoryId: number;
      secondaryCategoryId: number;
    }>
  >([]);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<
    Array<{
      id?: number;
      primaryCharacteristicId: number;
      secondaryCharacteristicId: number;
      comparisonType: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"basic" | "categories" | "characteristics">(
    "basic"
  );

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchCharacteristicTypes();
      fetchRuleDetails();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      const flatCategories = flattenCategories(data);
      setCategories(flatCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const flattenCategories = (categories: any[], prefix = ""): Category[] => {
    return categories.reduce((acc: Category[], category) => {
      const name = prefix ? `${prefix} → ${category.name}` : category.name;
      acc.push({ id: category.id, name });
      if (category.children?.length) {
        acc.push(...flattenCategories(category.children, name));
      }
      return acc;
    }, []);
  };

  const fetchCharacteristicTypes = async () => {
    try {
      const response = await fetch(
        "/api/admin/compatibility/characteristic-types"
      );
      const data = await response.json();
      setCharacteristicTypes(data);
    } catch (error) {
      console.error("Error fetching characteristic types:", error);
    }
  };

  const fetchRuleDetails = async () => {
    try {
      // Получаем подробную информацию о категориях правила
      const categoriesResponse = await fetch(
        `/api/admin/compatibility/categories?ruleId=${rule.id}`
      );
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setSelectedCategories(
          categoriesData.map((cat: any) => ({
            id: cat.id,
            primaryCategoryId: cat.primaryCategoryId,
            secondaryCategoryId: cat.secondaryCategoryId,
          }))
        );
      }

      // Получаем подробную информацию о характеристиках правила
      const characteristicsResponse = await fetch(
        `/api/admin/compatibility/characteristics?ruleId=${rule.id}`
      );
      if (characteristicsResponse.ok) {
        const characteristicsData = await characteristicsResponse.json();
        setSelectedCharacteristics(
          characteristicsData.map((char: any) => ({
            id: char.id,
            primaryCharacteristicId: char.primaryCharacteristicId,
            secondaryCharacteristicId: char.secondaryCharacteristicId,
            comparisonType: char.comparisonType,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching rule details:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Предотвращаем случайную отправку формы
    // Сохранение происходит только через handleSaveRule
  };

  const handleSaveRule = async () => {
    if (step !== "characteristics" || isLoading || !formData.name) {
      return;
    }

    setIsLoading(true);

    try {
      // Обновляем основную информацию правила
      const ruleResponse = await fetch(
        `/api/admin/compatibility/rules/${rule.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      if (!ruleResponse.ok) {
        throw new Error("Failed to update rule");
      }

      // Удаляем старые категории и добавляем новые
      await fetch(`/api/admin/compatibility/categories?ruleId=${rule.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      for (const categoryPair of selectedCategories) {
        await fetch("/api/admin/compatibility/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ruleId: rule.id,
            primaryCategoryId: categoryPair.primaryCategoryId,
            secondaryCategoryId: categoryPair.secondaryCategoryId,
          }),
          credentials: "include",
        });
      }

      // Удаляем старые характеристики и добавляем новые
      await fetch(
        `/api/admin/compatibility/characteristics?ruleId=${rule.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      for (const charPair of selectedCharacteristics) {
        await fetch("/api/admin/compatibility/characteristics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ruleId: rule.id,
            primaryCharacteristicId: charPair.primaryCharacteristicId,
            secondaryCharacteristicId: charPair.secondaryCharacteristicId,
            comparisonType: charPair.comparisonType,
          }),
          credentials: "include",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error updating rule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategoryPair = () => {
    setSelectedCategories((prev) => [
      ...prev,
      {
        primaryCategoryId: 0,
        secondaryCategoryId: 0,
      },
    ]);
  };

  const removeCategoryPair = (index: number) => {
    setSelectedCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCategoryPair = (index: number, field: string, value: number) => {
    setSelectedCategories((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const addCharacteristicPair = () => {
    setSelectedCharacteristics((prev) => [
      ...prev,
      {
        primaryCharacteristicId: 0,
        secondaryCharacteristicId: 0,
        comparisonType: "exact_match",
      },
    ]);
  };

  const removeCharacteristicPair = (index: number) => {
    setSelectedCharacteristics((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCharacteristicPair = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setSelectedCharacteristics((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const comparisonTypes = [
    { value: "exact_match", label: "Точное совпадение" },
    { value: "compatible_values", label: "Совместимые значения" },
    { value: "contains", label: "Содержит" },
    { value: "greater_than_or_equal", label: "Больше или равно" },
    {
      value: "greater_than_or_equal_combined",
      label: "Больше или равно (суммарно)",
    },
    { value: "frequency_match", label: "Совпадение частоты" },
    { value: "backward_compatible", label: "Обратная совместимость" },
    { value: "exists", label: "Существует" },
    { value: "greater_than_zero", label: "Больше нуля" },
    { value: "less_than_or_equal", label: "Меньше или равно" },
    { value: "power_sufficient", label: "Достаточная мощность" },
  ];

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
          <h2 className="text-xl font-semibold text-white">
            Редактировать правило: {rule.name}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-light hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {/* Шаги */}
        <div className="flex items-center justify-center p-4 border-b border-primary-border">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${step === "basic" ? "text-blue-400" : "text-secondary-light"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "basic" ? "bg-blue-500/20 border border-blue-500/30" : "bg-gradient-from/20 border border-primary-border"}`}
              >
                1
              </div>
              <span>Основная информация</span>
            </div>
            <div className="w-8 h-px bg-primary-border"></div>
            <div
              className={`flex items-center space-x-2 ${step === "categories" ? "text-blue-400" : "text-secondary-light"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "categories" ? "bg-blue-500/20 border border-blue-500/30" : "bg-gradient-from/20 border border-primary-border"}`}
              >
                2
              </div>
              <span>Категории</span>
            </div>
            <div className="w-8 h-px bg-primary-border"></div>
            <div
              className={`flex items-center space-x-2 ${step === "characteristics" ? "text-blue-400" : "text-secondary-light"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "characteristics" ? "bg-blue-500/20 border border-blue-500/30" : "bg-gradient-from/20 border border-primary-border"}`}
              >
                3
              </div>
              <span>Характеристики</span>
            </div>
          </div>
        </div>
        {/* Содержимое с прокруткой */}{" "}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Предотвращаем отправку формы по Enter
              if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
            className="p-6"
          >
            {step === "basic" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Название правила *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light"
                    placeholder="Введите название правила"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light"
                    placeholder="Введите описание правила"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {step === "categories" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    Пары категорий
                  </h3>
                  <button
                    type="button"
                    onClick={addCategoryPair}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить пару
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedCategories.map((pair, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-from/10 border border-primary-border rounded-lg"
                    >
                      <div className="flex-1">
                        <Select
                          value={pair.primaryCategoryId}
                          onChange={(value) =>
                            updateCategoryPair(
                              index,
                              "primaryCategoryId",
                              Number(value)
                            )
                          }
                          options={[
                            { value: 0, label: "Выберите первую категорию" },
                            ...categories.map((cat) => ({
                              value: cat.id,
                              label: cat.name,
                            })),
                          ]}
                        />
                      </div>
                      <span className="text-secondary-light">↔</span>
                      <div className="flex-1">
                        <Select
                          value={pair.secondaryCategoryId}
                          onChange={(value) =>
                            updateCategoryPair(
                              index,
                              "secondaryCategoryId",
                              Number(value)
                            )
                          }
                          options={[
                            { value: 0, label: "Выберите вторую категорию" },
                            ...categories.map((cat) => ({
                              value: cat.id,
                              label: cat.name,
                            })),
                          ]}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategoryPair(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "characteristics" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    Пары характеристик
                  </h3>
                  <button
                    type="button"
                    onClick={addCharacteristicPair}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить пару
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedCharacteristics.map((pair, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gradient-from/10 border border-primary-border rounded-lg space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="flex-1">
                          <Select
                            value={pair.primaryCharacteristicId}
                            onChange={(value) =>
                              updateCharacteristicPair(
                                index,
                                "primaryCharacteristicId",
                                Number(value)
                              )
                            }
                            options={[
                              {
                                value: 0,
                                label: "Выберите первую характеристику",
                              },
                              ...characteristicTypes.map((char) => ({
                                value: char.id,
                                label: char.name,
                              })),
                            ]}
                          />
                        </div>
                        <span className="text-secondary-light">↔</span>
                        <div className="flex-1">
                          <Select
                            value={pair.secondaryCharacteristicId}
                            onChange={(value) =>
                              updateCharacteristicPair(
                                index,
                                "secondaryCharacteristicId",
                                Number(value)
                              )
                            }
                            options={[
                              {
                                value: 0,
                                label: "Выберите вторую характеристику",
                              },
                              ...characteristicTypes.map((char) => ({
                                value: char.id,
                                label: char.name,
                              })),
                            ]}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCharacteristicPair(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>{" "}
                      <div>
                        <label className="block text-sm text-secondary-light mb-1">
                          Тип сравнения
                        </label>
                        <Select
                          value={pair.comparisonType}
                          onChange={(value) =>
                            updateCharacteristicPair(
                              index,
                              "comparisonType",
                              value as string
                            )
                          }
                          options={comparisonTypes.map((type) => ({
                            value: type.value,
                            label: type.label,
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки навигации */}
            <div className="flex justify-between mt-6 pt-6 border-t border-primary-border">
              <div>
                {step !== "basic" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === "categories") setStep("basic");
                      if (step === "characteristics") setStep("categories");
                    }}
                    className="px-4 py-2 text-secondary-light hover:text-white border border-primary-border hover:border-blue-500/30 rounded-lg transition-colors"
                  >
                    Назад
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-secondary-light hover:text-white border border-primary-border hover:border-red-500/30 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                {step !== "characteristics" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === "basic" && formData.name)
                        setStep("categories");
                      if (step === "categories") setStep("characteristics");
                    }}
                    disabled={step === "basic" && !formData.name}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Далее
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveRule}
                    disabled={isLoading || !formData.name}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
