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
import { CategoryCharacteristic } from "@/types/product";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryWithChildren[];
  onSuccess?: () => void;
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

export default function AddProductModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
}: AddProductModalProps) {
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const stepTitles = {
    1: "Выбор категории",
    2: "Основная информация",
    3: "Характеристики",
  };

  // Получение брендов для выбранной категории
  useEffect(() => {
    if (formData.subcategoryId || formData.categoryId) {
      // Используем ID подкатегории, если она выбрана, иначе ID основной категории
      const targetCategoryId = formData.subcategoryId || formData.categoryId;
      if (targetCategoryId) {
        fetch(`/api/admin/categories/${targetCategoryId}/brands`)
          .then((res) => res.json())
          .then((data) => setBrands(data));
      }
    }
  }, [formData.categoryId, formData.subcategoryId]);

  // Получение характеристик для выбранной категории
  useEffect(() => {
    if (formData.subcategoryId || formData.categoryId) {
      // Используем ID подкатегории, если она выбрана, иначе ID основной категории
      const targetCategoryId = formData.subcategoryId || formData.categoryId;
      if (targetCategoryId) {
        fetch(`/api/admin/categories/${targetCategoryId}/characteristics`)
          .then((res) => res.json())
          .then((data) => setCharacteristics(data));
      }
    }
  }, [formData.categoryId, formData.subcategoryId]); // Добавляем обе зависимости  // Управление preview URL изображения
  useEffect(() => {
    console.log('Image changed:', formData.image); // Отладка
    if (formData.image) {
      // Используем FileReader для создания data URL вместо blob URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log('Created preview data URL'); // Отладка
        setImagePreviewUrl(dataUrl);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setImagePreviewUrl(null);
      };
      reader.readAsDataURL(formData.image);
    } else {
      console.log('No image, clearing preview URL'); // Отладка
      setImagePreviewUrl(null);
    }
  }, [formData.image]);

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

    // Валидация обязательных полей
    if (!formData.title.trim()) {
      alert("Пожалуйста, введите название товара");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Пожалуйста, введите корректную цену");
      return;
    }

    if (!formData.brand.trim()) {
      alert("Пожалуйста, выберите или введите бренд");
      return;
    }

    setIsLoading(true);

    try {
      // Создаем FormData для отправки файла
      const submitFormData = new FormData();

      submitFormData.append(
        "categoryId",
        (formData.subcategoryId || formData.categoryId)!.toString()
      );
      submitFormData.append("title", formData.title.trim());
      submitFormData.append("price", formData.price);
      submitFormData.append("brand", formData.brand.trim());
      submitFormData.append("description", formData.description.trim());

      // Добавляем изображение, если оно есть
      if (formData.image) {
        submitFormData.append("image", formData.image);
      }

      // Добавляем характеристики
      submitFormData.append(
        "characteristics",
        JSON.stringify(formData.characteristics)
      );

      const response = await fetch("/api/admin/products", {
        method: "POST",
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при создании товара");
      }

      const result = await response.json();

      // Успешное создание товара
      console.log("Товар успешно создан:", result);

      // Очищаем форму
      handleClearForm();

      // Вызываем callback для обновления списка
      if (onSuccess) {
        onSuccess();
      }

      // Закрываем модальное окно
      onClose();
    } catch (error) {
      console.error("Ошибка при создании товара:", error);
      alert(
        `Ошибка при создании товара: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`
      );
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

  // Проверяем возможность перехода к определенному шагу
  const canNavigateToStep = (targetStep: number) => {
    if (targetStep === 1) return true;
    if (targetStep === 2 || targetStep === 3)
      return formData.categoryId !== null;
    return false;
  };

  // Обработчик клика по шагу
  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
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

      {/* Индикатор активного шага */}
      {step === stepNumber && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-lg" />
      )}
    </div>
  );

  if (!isOpen) return null;

  // Define categoryOptions using the categories prop
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const renderImageUpload = () => (
    <div className="relative aspect-square rounded-lg border-2 border-dashed border-primary-border bg-gradient-from/10 overflow-hidden group">
      {formData.image && imagePreviewUrl ? (
        <div className="w-full h-full relative">
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
            onError={() => {
              console.error("Error loading image preview");
              setImagePreviewUrl(null);
              setFormData((prev) => ({ ...prev, image: null }));
            }}
          />
          <button
            type="button"
            onClick={() => {
              setImagePreviewUrl(null);
              setFormData((prev) => ({
                ...prev,
                image: null,
              }));
            }}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <span className="text-white text-sm">Удалить</span>
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
          <Upload className="w-8 h-8 text-secondary-light mb-2" />
          <span className="text-sm text-secondary-light">
            Загрузить изображение
          </span>
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              console.log('File selected:', file); // Отладка
              if (file) {
                // Проверяем тип файла
                if (!file.type.startsWith('image/')) {
                  alert('Пожалуйста, выберите файл изображения');
                  return;
                }
                
                // Проверяем размер файла (максимум 10MB)
                if (file.size > 10 * 1024 * 1024) {
                  alert('Размер файла не должен превышать 10MB');
                  return;
                }
                
                console.log('Setting file to formData:', file.name); // Отладка
                setFormData((prev) => ({
                  ...prev,
                  image: file,
                }));
              }
            }}
          />
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="h-full">
            <div className="max-w-4xl mx-auto p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-from/20 rounded-lg border border-primary-border">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white">
                    Выберите категорию
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-light">
                      Основная категория
                    </label>
                    <Select
                      value={formData.categoryId || ""}
                      onChange={(value) => handleCategorySelect(Number(value))}
                      options={categoryOptions}
                      placeholder="Выберите категорию"
                    />
                  </div>

                  {selectedCategory?.children &&
                    selectedCategory.children.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-light">
                          Подкатегория
                        </label>
                        <Select
                          value={formData.subcategoryId || ""}
                          onChange={(value) =>
                            handleSubcategorySelect(Number(value))
                          }
                          options={selectedCategory.children.map((subcat) => ({
                            value: subcat.id,
                            label: subcat.name,
                          }))}
                          placeholder="Выберите подкатегорию"
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="h-full">
            <div className="max-w-4xl mx-auto p-6">
              {/* Верхняя часть - изображение и основная информация */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Изображение */}
                <div>
                  <label className="block text-sm text-secondary-light mb-2">
                    Изображение товара
                  </label>
                  {renderImageUpload()}
                  <div className="mt-2 text-xs text-center text-secondary-light">
                    Рекомендуемый размер: 800x800px
                  </div>
                </div>

                {/* Основная информация */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-secondary-light mb-2">
                      Название товара
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
                      className="w-full px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white"
                      placeholder="Введите название товара"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-secondary-light mb-2">
                      Цена
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400">
                        ₽
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-secondary-light mb-2">
                      Бренд
                    </label>
                    {isNewBrand ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              brand: e.target.value,
                            }))
                          }
                          className="flex-1 px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white"
                          placeholder="Новый бренд"
                        />
                        <button
                          onClick={() => setIsNewBrand(false)}
                          className="px-3 rounded-lg bg-gradient-from/20 text-secondary-light hover:text-white border border-primary-border"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <Select
                        value={formData.brand}
                        onChange={handleBrandChange}
                        options={[
                          ...brands.map((brand) => ({
                            value: brand,
                            label: brand,
                          })),
                          { value: "new", label: "+ Добавить бренд" },
                        ]}
                        placeholder="Выберите бренд"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Описание внизу */}
              <div>
                <label className="block text-sm text-secondary-light mb-2">
                  Описание товара
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full h-[200px] px-4 py-3 bg-gradient-from/10 border border-primary-border rounded-lg text-white resize-none"
                    placeholder="Введите описание товара..."
                  />
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 text-xs text-secondary-light bg-gradient-from/20 rounded border border-primary-border">
                    {formData.description.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Заголовок */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-from/20 rounded-lg border border-primary-border">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white">
                      Характеристики {selectedCategory?.name}
                    </h3>
                  </div>
                  <div className="text-sm text-secondary-light">
                    Заполнено: {Object.keys(formData.characteristics).length} из{" "}
                    {characteristics.length}
                  </div>
                </div>

                {/* Таблица характеристик */}
                <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
                  <div className="grid">
                    {characteristics.map((char, index) => (
                      <div
                        key={char.id}
                        className={`grid grid-cols-[300px,1fr] ${
                          index !== characteristics.length - 1
                            ? "border-b border-primary-border/50"
                            : ""
                        }`}
                      >
                        {/* Название характеристики */}
                        <div className="p-4 bg-gradient-from/20 border-r border-primary-border">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                formData.characteristics[char.id]
                                  ? "bg-blue-400"
                                  : "bg-secondary-light/30"
                              }`}
                            />
                            <span className="text-sm font-medium text-white">
                              {char.name}
                            </span>
                          </div>
                        </div>

                        {/* Поле ввода */}
                        <div className="p-4">
                          <input
                            type="text"
                            value={formData.characteristics[char.id] || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                characteristics: {
                                  ...prev.characteristics,
                                  [char.id]: e.target.value,
                                },
                              }))
                            }
                            placeholder="Введите значение"
                            className="w-full px-4 py-2.5 rounded-lg bg-gradient-from/20 
                                 border border-primary-border text-white 
                                 placeholder:text-secondary-light/50 
                                 focus:border-blue-500/30 focus:bg-gradient-from/30 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Подсказка */}
                <div className="flex items-center gap-3 p-4 bg-gradient-from/10 rounded-lg border border-primary-border/50">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-secondary-light">Заполнено</span>
                  </div>
                  <div className="w-px h-4 bg-primary-border/50" />
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-light/30" />
                    <span className="text-secondary-light">Не заполнено</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleClearForm = () => {
    // Очищаем preview URL перед очисткой формы
    setImagePreviewUrl(null);
    
    setFormData({
      categoryId: null,
      subcategoryId: null,
      title: "",
      price: "",
      brand: "",
      description: "",
      image: null,
      characteristics: {},
    });
    setIsNewBrand(false);
    setSelectedCategory(null);
    setStep(1);
    setShowClearConfirm(false);
  };

  const renderLeftPanel = () => (
    <div className="w-72 bg-gradient-from/10 border-r border-primary-border flex flex-col">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-from/20 rounded-lg border border-primary-border mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-medium text-white">Новый товар</h2>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 text-secondary-light hover:text-red-400 transition-colors"
            title="Очистить форму"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((stepNumber) => renderStepIndicator(stepNumber))}
        </div>
      </div>

      {/* Прогресс */}
      <div className="p-6 border-t border-primary-border bg-gradient-from/5">
        <div className="flex justify-between items-center text-xs text-secondary-light mb-2">
          <span>Прогресс</span>
          <span>{Math.round((step / 3) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gradient-from/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );

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
        className="relative z-[101] w-full max-w-5xl bg-gradient-to-b from-primary to-primary-dark rounded-xl shadow-xl border border-primary-border flex h-[85vh] overflow-hidden"
      >
        {renderLeftPanel()}

        {/* Правая панель */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">{renderContent()}</div>

          {/* Кнопки */}
          <div className="shrink-0 p-6 border-t border-primary-border bg-gradient-from/5">
            <div className="flex justify-between gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 
                           text-secondary-light hover:text-white border border-primary-border 
                           transition-all flex items-center gap-2"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  <span>Назад</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (step < 3) setStep(step + 1);
                  else handleSubmit();
                }}
                disabled={!canProceed() || isLoading}
                className={`ml-auto px-6 py-2.5 rounded-lg flex items-center gap-2
                  ${
                    step === 3
                      ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30"
                      : "bg-gradient-from/20 hover:bg-gradient-from/30 text-white border border-primary-border"
                  }
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Создание...</span>
                  </>
                ) : (
                  <>
                    <span>{step === 3 ? "Создать товар" : "Продолжить"}</span>
                    {step < 3 && <ChevronRightIcon className="w-5 h-5" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Модальное окно подтверждения очистки */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative z-[201] w-full max-w-md bg-primary rounded-xl border border-primary-border p-6">
            <h3 className="text-xl font-medium text-white mb-4">
              Подтверждение очистки
            </h3>
            <p className="text-secondary-light mb-6">
              Вы уверены, что хотите очистить все введенные данные? Это действие
              нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearForm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all"
              >
                Очистить
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white border border-primary-border transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
