import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Select from "@/components/common/ui/Select";
import { CategoryWithChildren } from "@/types/category";
import { ImageIcon, Upload, Package } from "lucide-react";
import { CategoryCharacteristic, Product } from "@/types/product";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  categories: CategoryWithChildren[];
  product: Product;
}

interface FormData {
  categoryId: number | null;
  subcategoryId: number | null;
  title: string;
  price: string;
  brand: string;
  description: string;
  image: File | null;
  characteristics: Record<number, string>;
}

export default function EditProductModal({
  isOpen,
  onClose,
  onSave,
  categories,
  product,
}: EditProductModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    categoryId: null,
    subcategoryId: null,
    title: "",
    price: "",
    brand: "",
    description: "",
    image: null,
    characteristics: {},
  });

  const [brands, setBrands] = useState<string[]>([]);
  const [characteristics, setCharacteristics] = useState<
    CategoryCharacteristic[]
  >([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithChildren | null>(null);
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stepTitles = {
    1: "Выбор категории",
    2: "Основная информация",
    3: "Характеристики",
  };

  // Инициализация формы данными товара
  useEffect(() => {
    if (isOpen && product) {
      // Найдем категорию товара
      const productCategory = categories.find((cat) => {
        if (cat.id === product.categoryId) return true;
        return cat.children?.some((subcat) => subcat.id === product.categoryId);
      });

      const isSubcategory = productCategory?.children?.some(
        (subcat) => subcat.id === product.categoryId
      );

      setFormData({
        categoryId: isSubcategory
          ? productCategory?.id || null
          : product.categoryId,
        subcategoryId: isSubcategory ? product.categoryId : null,
        title: product.title,
        price: product.price.toString(),
        brand: product.brand || "",
        description: product.description || "",
        image: null,
        characteristics: {},
      });

      setSelectedCategory(productCategory || null);

      // Загружаем бренды для категории
      const targetCategoryId = isSubcategory
        ? product.categoryId
        : productCategory?.id;
      if (targetCategoryId) {
        fetch(`/api/admin/categories/${targetCategoryId}/brands`)
          .then((res) => res.json())
          .then((data) => setBrands(data))
          .catch(console.error);
      }
    }
  }, [isOpen, product, categories]);
  // Получение брендов для выбранной категории
  useEffect(() => {
    if (formData.subcategoryId || formData.categoryId) {
      // Используем ID подкатегории, если она выбрана, иначе ID основной категории
      const targetCategoryId = formData.subcategoryId || formData.categoryId;
      if (targetCategoryId) {
        fetch(`/api/admin/categories/${targetCategoryId}/brands`)
          .then((res) => res.json())
          .then((data) => setBrands(data))
          .catch(console.error);
      }
    }
  }, [formData.categoryId, formData.subcategoryId]);

  // Получение характеристик для выбранной категории
  useEffect(() => {
    if (formData.subcategoryId || formData.categoryId) {
      const targetCategoryId = formData.subcategoryId || formData.categoryId;
      if (targetCategoryId) {
        fetch(`/api/admin/categories/${targetCategoryId}/characteristics`)
          .then((res) => res.json())
          .then((data) => {
            console.log("Загруженные типы характеристик категории:", data);
            console.log("Характеристики товара:", product.characteristics);
            setCharacteristics(data); // Заполняем характеристики продукта после загрузки типов характеристик
            if (
              product.characteristics &&
              Array.isArray(product.characteristics)
            ) {
              const characteristicsMap: Record<number, string> = {};

              // Проходим по всем характеристикам товара
              product.characteristics.forEach((productChar: any) => {
                console.log("Обрабатываем характеристику товара:", productChar);

                // Используем characteristic_type_id для сопоставления
                if (productChar.characteristic_type_id) {
                  const charType = data.find(
                    (ct: CategoryCharacteristic) =>
                      ct.id === productChar.characteristic_type_id
                  );

                  console.log("Найденный тип характеристики:", charType);

                  if (charType) {
                    characteristicsMap[charType.id] = productChar.value;
                  }
                }
              });

              console.log("Итоговая карта характеристик:", characteristicsMap);

              setFormData((prev) => ({
                ...prev,
                characteristics: characteristicsMap,
              }));
            }
          })
          .catch(console.error);
      }
    }
  }, [formData.categoryId, formData.subcategoryId]);

  const handleCategorySelect = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    setSelectedCategory(category || null);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      subcategoryId: null,
    }));
  };

  const handleSubcategorySelect = (subcategoryId: number) => {
    setFormData((prev) => ({ ...prev, subcategoryId }));
  };

  const handleBrandChange = (value: string | number) => {
    if (value === "new") {
      setIsNewBrand(true);
      setFormData((prev) => ({ ...prev, brand: "" }));
    } else {
      setFormData((prev) => ({ ...prev, brand: value.toString() }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsLoading(true);
    try {
      const updatedProductData = {
        id: product.id,
        categoryId: formData.subcategoryId || formData.categoryId,
        title: formData.title,
        price: parseFloat(formData.price),
        brand: formData.brand,
        description: formData.description,
        characteristics: formData.characteristics,
        image: formData.image,
      };

      await onSave(updatedProductData);
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      if (!selectedCategory) return false;
      return selectedCategory.children && selectedCategory.children.length > 0
        ? formData.subcategoryId !== null
        : true;
    }
    return true;
  };

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return canProceed();
    if (targetStep === 3)
      return canProceed() && formData.title && formData.price;
    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
  };

  const nextStep = () => {
    if (step < 3 && canProceed()) {
      if (step === 2 && (!formData.title || !formData.price)) {
        return;
      }
      setStep(step + 1);
    } else if (step === 3) {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const clearImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleCharacteristicChange = (id: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        [id]: value,
      },
    }));
  };

  const renderStepIndicator = (stepNumber: number) => (
    <div
      key={`step-${stepNumber}`}
      onClick={() => handleStepClick(stepNumber)}
      className={`relative px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer
        ${
          step === stepNumber
            ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
            : canNavigateToStep(stepNumber)
              ? "hover:bg-gradient-from/20 text-secondary-light hover:text-white"
              : "opacity-50 cursor-not-allowed text-secondary-light/50"
        }
        ${
          step === stepNumber
            ? "border border-blue-500/30"
            : "border border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
            ${
              step === stepNumber
                ? "bg-blue-500/10 text-blue-400"
                : "bg-gradient-from/20 text-secondary-light"
            }
          `}
        >
          {stepNumber}
        </div>
        <span className="font-medium">
          {stepTitles[stepNumber as keyof typeof stepTitles]}
        </span>
      </div>

      {step === stepNumber && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-lg" />
      )}
    </div>
  );

  if (!isOpen) return null;

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const getSubcategoryOptions = () => {
    if (!selectedCategory?.children) return [];
    return selectedCategory.children.map((subcat) => ({
      value: subcat.id,
      label: subcat.name,
    }));
  };

  const getBrandOptions = () => {
    const options = brands.map((brand) => ({ value: brand, label: brand }));
    options.push({ value: "new", label: "Добавить новый бренд..." });
    return options;
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative bg-primary-dark border border-primary-border rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-[101]"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <Package className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Редактировать товар
              </h2>
              <p className="text-secondary-light text-sm">
                Обновите информацию о товаре по шагам
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-light hover:text-white rounded-lg hover:bg-gradient-from/20 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>{" "}
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Индикаторы шагов */}
          <div className="w-80 flex-shrink-0">
            <div className="space-y-2">
              {[1, 2, 3].map((stepNumber) => renderStepIndicator(stepNumber))}
            </div>
          </div>          {/* Содержимое шага */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="w-full max-w-none p-6 bg-gradient-from/5 rounded-lg border border-primary-border/50">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6 relative z-20 min-h-[400px]"
                >
                  <div>
                    <h3 className="text-lg font-medium text-white mb-6">
                      Выберите категорию товара
                    </h3>
                    <div className="space-y-6">
                      <div className="relative z-30">
                        <label className="block text-white text-sm font-medium mb-3">
                          Основная категория
                        </label>
                        <div className="relative z-50">
                          <Select
                            value={formData.categoryId || ""}
                            onChange={(value) =>
                              handleCategorySelect(Number(value))
                            }
                            options={categoryOptions}
                            placeholder="Выберите категорию"
                          />
                        </div>
                      </div>

                      {selectedCategory?.children &&
                        selectedCategory.children.length > 0 && (
                          <div className="relative z-20">
                            <label className="block text-white text-sm font-medium mb-3">
                              Подкатегория
                            </label>
                            <div className="relative z-40">
                              <Select
                                value={formData.subcategoryId || ""}
                                onChange={(value) =>
                                  handleSubcategorySelect(Number(value))
                                }
                                options={getSubcategoryOptions()}
                                placeholder="Выберите подкатегорию"
                              />
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}{" "}              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-medium text-white mb-6">
                      Основная информация о товаре
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-white text-sm font-medium mb-3">
                          Название товара *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light focus:border-blue-500/50 focus:outline-none transition-colors"
                          placeholder="Введите название товара"
                        />
                      </div>                      <div>
                        <label className="block text-white text-sm font-medium mb-3">
                          Цена *
                        </label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light focus:border-blue-500/50 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-3">
                          Бренд
                        </label>
                        {isNewBrand ? (
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={formData.brand}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  brand: e.target.value,
                                }))
                              }
                              className="flex-1 px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light focus:border-blue-500/50 focus:outline-none transition-colors"
                              placeholder="Введите новый бренд"
                            />
                            <button
                              type="button"
                              onClick={() => setIsNewBrand(false)}
                              className="px-4 py-3 text-secondary-light hover:text-white border border-primary-border rounded-lg hover:bg-gradient-from/10 transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <div className="relative z-30">
                            <Select
                              value={formData.brand}
                              onChange={handleBrandChange}
                              options={getBrandOptions()}
                              placeholder="Выберите бренд"
                            />
                          </div>
                        )}
                      </div><div>
                        <label className="block text-white text-sm font-medium mb-3">
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
                          rows={4}
                          className="w-full px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light resize-none focus:border-blue-500/50 focus:outline-none transition-colors"
                          placeholder="Описание товара"
                        />
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Изображение товара
                        </label>
                        <div className="space-y-3">
                          {/* Текущее изображение */}
                          {product.image && !formData.image && (
                            <div className="relative">
                              <div className="p-4 bg-gradient-from/10 border border-primary-border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={product.image}
                                    alt="Текущее изображение"
                                    className="w-16 h-16 object-contain rounded-lg border border-primary-border"
                                  />
                                  <div>
                                    <p className="text-white text-sm">
                                      Текущее изображение
                                    </p>
                                    <p className="text-secondary-light text-xs">
                                      Загрузите новое, чтобы заменить
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Загрузка нового изображения */}
                          {formData.image ? (
                            <div className="relative">
                              <div className="p-4 bg-gradient-from/10 border border-primary-border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <ImageIcon className="w-8 h-8 text-blue-400" />
                                    <div>
                                      <p className="text-white text-sm">
                                        {formData.image.name}
                                      </p>
                                      <p className="text-secondary-light text-xs">
                                        {(
                                          formData.image.size /
                                          1024 /
                                          1024
                                        ).toFixed(2)}{" "}
                                        MB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={clearImage}
                                    className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-primary-border rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors">
                              <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="image-upload"
                                className="cursor-pointer block"
                              >
                                <Upload className="w-8 h-8 text-secondary-light mx-auto mb-2" />
                                <p className="text-white text-sm mb-1">
                                  Загрузить новое изображение
                                </p>
                                <p className="text-secondary-light text-xs">
                                  PNG, JPG до 10MB
                                </p>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-medium text-white mb-6">
                      Характеристики товара
                    </h3>
                    {characteristics.length > 0 ? (
                      <div className="space-y-6">
                        {characteristics.map((char) => (
                          <div key={char.id}>
                            <label className="block text-white text-sm font-medium mb-3">
                              {char.name}
                            </label>
                            <input
                              type="text"
                              value={formData.characteristics[char.id] || ""}
                              onChange={(e) =>
                                handleCharacteristicChange(
                                  char.id,
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light focus:border-blue-500/50 focus:outline-none transition-colors"
                              placeholder={`Введите ${char.name.toLowerCase()}`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-secondary-light/50 mx-auto mb-4" />
                        <p className="text-secondary-light">
                          Для выбранной категории характеристики не найдены
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
        {/* Кнопки управления */}
        <div className="flex items-center justify-between pt-6 border-t border-primary-border">
          <div className="flex items-center gap-3">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary-border text-secondary-light hover:text-white hover:bg-gradient-from/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Назад
            </button>
            <span className="text-secondary-light text-sm">
              Шаг {step} из 3
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Сохранить изменения" : "Далее"}
              {step < 3 && <ChevronRightIcon className="w-5 h-5" />}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
            </button>
          </div>
        </div>{" "}
        {/* Подтверждение отмены */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]">
            <div className="bg-primary-dark border border-primary-border rounded-xl p-6 max-w-md w-full mx-4 z-[111]">
              <h3 className="text-lg font-medium text-white mb-3">
                Отменить редактирование?
              </h3>
              <p className="text-secondary-light mb-6">
                Все внесенные изменения будут потеряны. Это действие нельзя
                отменить.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-primary-border text-secondary-light hover:text-white hover:bg-gradient-from/10 transition-colors"
                >
                  Продолжить редактирование
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Отменить изменения
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
