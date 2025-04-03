"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useAnimation,
} from "framer-motion";
import {
  CheckCircleIcon,
  CpuChipIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { ServerIcon, MemoryStick } from "lucide-react";
import ProductSelection from "./ProductSelection";
import CategorySelection from "./CategorySelection";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const DEMO_CATEGORIES: Category[] = [
  { id: "cpu", name: "Процессор", icon: "cpu" },
  { id: "motherboard", name: "Материнская плата", icon: "motherboard" },
  { id: "gpu", name: "Видеокарта", icon: "gpu" },
  { id: "ram", name: "Оперативная память", icon: "ram" },
];

const DEMO_PRODUCTS: Record<string, Product[]> = {
  cpu: [
    { id: "cpu1", name: "Intel Core i5-12600K", price: 22990 },
    { id: "cpu2", name: "AMD Ryzen 7 5800X", price: 24990 },
    { id: "cpu3", name: "Intel Core i9-12900K", price: 45990 },
  ],
  motherboard: [
    { id: "mb1", name: "ASUS ROG STRIX B550-F", price: 15990 },
    { id: "mb2", name: "MSI MPG Z690 EDGE", price: 29990 },
    { id: "mb3", name: "Gigabyte B660M DS3H", price: 11990 },
  ],
  gpu: [
    { id: "gpu1", name: "NVIDIA GeForce RTX 3060", price: 42990 },
    { id: "gpu2", name: "AMD Radeon RX 6700 XT", price: 45990 },
    { id: "gpu3", name: "NVIDIA GeForce RTX 3080", price: 89990 },
  ],
  ram: [
    { id: "ram1", name: "Kingston FURY 16GB (2x8GB)", price: 8990 },
    { id: "ram2", name: "Corsair Vengeance 32GB (2x16GB)", price: 14990 },
    { id: "ram3", name: "G.Skill Trident Z RGB 16GB (2x8GB)", price: 9990 },
  ],
};

const AnimatedCategoryIcon = ({ type }: { type: string }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });

  useEffect(() => {
    if (isInView) {
      controls.start("animate");
    } else {
      controls.stop();
    }
  }, [controls, isInView]);

  const renderIcon = () => {
    switch (type) {
      case "cpu":
        return (
          <motion.div
            ref={ref}
            initial="initial"
            animate={controls}
            variants={{
              initial: { rotateZ: 0 },
              animate: {
                rotateZ: [0, 15, 0, -15, 0],
                transition: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              },
            }}
          >
            <CpuChipIcon className="w-10 h-10 text-blue-400" />
          </motion.div>
        );

      case "motherboard":
        return (
          <motion.div
            ref={ref}
            initial="initial"
            animate={controls}
            variants={{
              initial: { opacity: 0.7 },
              animate: {
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.05, 1],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              },
            }}
          >
            <ServerIcon className="w-10 h-10 text-purple-400" />
          </motion.div>
        );

      case "gpu":
        return (
          <motion.div
            ref={ref}
            initial="initial"
            animate={controls}
            variants={{
              initial: { y: 0 },
              animate: {
                y: [0, -5, 0, 5, 0],
                transition: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              },
            }}
          >
            <CircleStackIcon className="w-10 h-10 text-emerald-400" />
          </motion.div>
        );

      case "ram":
        return (
          <motion.div
            ref={ref}
            initial="initial"
            animate={controls}
            variants={{
              initial: { rotate: 0 },
              animate: {
                rotate: [0, 0, 10, 0, -10, 0],
                transition: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              },
            }}
          >
            <MemoryStick className="w-10 h-10 text-yellow-400" />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return renderIcon();
};

const InteractiveConfigurator = () => {
  const [currentStep, setCurrentStep] = useState<"category" | "products">(
    "category"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, string>
  >({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [compatibility, setCompatibility] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [demoSequenceIndex, setDemoSequenceIndex] = useState(0);

  const configRef = useRef(null);
  const isInView = useInView(configRef, { once: false, margin: "-100px" });
  const controls = useAnimation();
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const demoSequence = [
    { action: "selectCategory", data: "cpu" },
    { action: "selectProduct", data: "cpu2" },
    { action: "selectCategory", data: "motherboard" },
    { action: "selectProduct", data: "mb1" },
    { action: "selectCategory", data: "gpu" },
    { action: "selectProduct", data: "gpu2" },
    { action: "selectCategory", data: "ram" },
    { action: "selectProduct", data: "ram2" },
    { action: "reset", data: null },
  ];

  // Эффект для управления анимацией в зависимости от видимости
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
      // Запускаем демо-последовательность, если в поле зрения
      if (demoMode) {
        advanceDemoSequence();
      }
    } else {
      controls.start("hidden");
      // Приостанавливаем демо, если вышли из поля зрения
      if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
      }
    }

    return () => {
      // Очистка при размонтировании
      if (demoTimeoutRef.current) {
        clearTimeout(demoTimeoutRef.current);
      }
    };
  }, [controls, isInView, demoMode, demoSequenceIndex]);

  // Функция для продвижения демо-последовательности
  const advanceDemoSequence = () => {
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
    }

    if (!demoMode || !isInView) return;

    const currentAction = demoSequence[demoSequenceIndex];

    if (!currentAction) {
      // Цикл завершен, начинаем сначала
      setDemoSequenceIndex(0);
      setSelectedProducts({});
      setCurrentStep("category");
      setSelectedCategory(null);

      demoTimeoutRef.current = setTimeout(() => {
        advanceDemoSequence();
      }, 3000);
      return;
    }

    switch (currentAction.action) {
      case "selectCategory":
        setCurrentStep("products");
        setSelectedCategory(currentAction.data);
        break;

      case "selectProduct":
        if (selectedCategory) {
          setSelectedProducts((prev) => ({
            ...prev,
            [selectedCategory]: currentAction.data as string,
          }));
          setCurrentStep("category");
          setSelectedCategory(null);
        }
        break;

      case "reset":
        setSelectedProducts({});
        setCurrentStep("category");
        setSelectedCategory(null);
        break;
    }

    demoTimeoutRef.current = setTimeout(
      () => {
        setDemoSequenceIndex(
          (prevIndex) => (prevIndex + 1) % demoSequence.length
        );
        advanceDemoSequence();
      },
      currentAction.action === "reset" ? 5000 : 2000
    );
  };

  useEffect(() => {
    let price = 0;
    Object.entries(selectedProducts).forEach(([categoryId, productId]) => {
      const product = DEMO_PRODUCTS[categoryId]?.find(
        (p) => p.id === productId
      );
      if (product) {
        price += product.price;
      }
    });
    setTotalPrice(price);

    const selectedCount = Object.keys(selectedProducts).length;
    setCompatibility(
      selectedCount > 0
        ? Math.min(
            Math.floor((selectedCount / DEMO_CATEGORIES.length) * 100),
            100
          )
        : 0
    );
  }, [selectedProducts]);

  const handleCategorySelect = (categoryId: string) => {
    if (demoMode) return;
    setSelectedCategory(categoryId);
    setCurrentStep("products");
  };

  const handleProductSelect = (productId: string) => {
    if (demoMode) return;
    if (selectedCategory) {
      setSelectedProducts((prev) => ({
        ...prev,
        [selectedCategory]: productId,
      }));
      setCurrentStep("category");
      setSelectedCategory(null);
    }
  };

  const handleBackToCategories = () => {
    if (demoMode) return;
    setCurrentStep("category");
    setSelectedCategory(null);
  };

  return (
    <motion.div
      ref={configRef}
      initial="hidden"
      animate={controls}
      variants={{
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0.5, scale: 0.98 },
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-lg relative"
    >
      <div className="absolute -inset-4 z-0">
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          animate={{
            background: [
              "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
              "radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
              "radial-gradient(circle at 30% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
              "radial-gradient(circle at 70% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
              "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-500/8"
            initial={{
              x: Math.random() * 100 - 50 + "%",
              y: Math.random() * 100 - 50 + "%",
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.2 + 0.1,
            }}
            animate={{
              x: [
                Math.random() * 100 - 50 + "%",
                Math.random() * 100 - 50 + "%",
                Math.random() * 100 - 50 + "%",
                Math.random() * 100 - 50 + "%",
              ],
              y: [
                Math.random() * 100 - 50 + "%",
                Math.random() * 100 - 50 + "%",
                Math.random() * 100 - 50 + "%",
                Math.random() * 100 - 50 + "%",
              ],
              opacity: [0.05, 0.2, 0.15, 0.05],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 rounded-xl overflow-hidden border border-primary-border/80 bg-gradient-from/15 backdrop-blur-md shadow-[0_10px_40px_-15px_rgba(59,130,246,0.1)]">
        <div className="h-10 bg-gradient-from/25 border-b border-primary-border/80 flex items-center px-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-secondary-light">Конфигуратор</span>
          </div>
        </div>

        <div className="p-6 h-[400px] relative flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              {currentStep === "category" ? (
                <>
                  <motion.div
                    animate={{
                      rotate: [0, 8, 0, -8, 0],
                      scale: [1, 1.08, 1, 1.08, 1],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <CpuChipIcon className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  <span>Выбор категории</span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{
                      y: [0, -4, 0, 4, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <CircleStackIcon className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  <span>Выбор компонента</span>
                </>
              )}
            </h3>
            <div className="px-2 py-1 text-xs bg-gradient-from/25 rounded-md text-secondary-light border border-primary-border/40">
              {currentStep === "category" ? "Шаг 1" : "Шаг 2"}
            </div>
          </div>

          {currentStep === "category" &&
            Object.keys(selectedProducts).length > 0 && (
              <div className="absolute -right-2 -top-2 flex">
                {Object.keys(selectedProducts)
                  .slice(0, 3)
                  .map((categoryId, idx) => (
                    <motion.div
                      key={categoryId}
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: idx * 0.15,
                      }}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${
                        idx === 0
                          ? "from-blue-500/15 to-blue-600/15 border-blue-500/25"
                          : idx === 1
                          ? "from-purple-500/15 to-pink-600/15 border-purple-500/25"
                          : "from-emerald-500/15 to-teal-600/15 border-emerald-500/25"
                      } border flex items-center justify-center -ml-2 shadow-sm`}
                    >
                      <AnimatedCategoryIcon type={categoryId} />
                    </motion.div>
                  ))}
                {Object.keys(selectedProducts).length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gradient-from/25 border border-primary-border/80 flex items-center justify-center -ml-2 text-xs text-white font-medium">
                    +{Object.keys(selectedProducts).length - 3}
                  </div>
                )}
              </div>
            )}

          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {currentStep === "category" ? (
                <CategorySelection
                  key="categories"
                  categories={DEMO_CATEGORIES}
                  onCategorySelect={handleCategorySelect}
                  selectedProducts={selectedProducts}
                  isInView={isInView}
                  demoMode={demoMode}
                  highlightedCategory={
                    demoMode &&
                    demoSequence[demoSequenceIndex]?.action === "selectCategory"
                      ? demoSequence[demoSequenceIndex].data
                      : null
                  }
                />
              ) : (
                <ProductSelection
                  key="products"
                  products={
                    selectedCategory ? DEMO_PRODUCTS[selectedCategory] : []
                  }
                  onProductSelect={handleProductSelect}
                  onBackClick={handleBackToCategories}
                  categoryName={
                    DEMO_CATEGORIES.find((c) => c.id === selectedCategory)
                      ?.name || ""
                  }
                  isInView={isInView}
                  demoMode={demoMode}
                  highlightedProduct={
                    demoMode &&
                    demoSequence[demoSequenceIndex]?.action === "selectProduct"
                      ? demoSequence[demoSequenceIndex].data
                      : null
                  }
                />
              )}
            </AnimatePresence>
          </div>

          <div className="pt-5 mt-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondary-light">
                Совместимость компонентов
              </span>
              <span className="text-xs text-blue-400">{compatibility}%</span>
            </div>
            <div className="h-2 bg-gradient-from/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${compatibility}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 rounded-full relative"
              >
                {compatibility > 0 && (
                  <motion.div
                    className="absolute right-0 top-0 bottom-0 w-6 bg-white/20 blur-[5px]"
                    animate={{
                      x: [30, -15],
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>
            </div>

            {Object.keys(selectedProducts).length > 0 && (
              <div className="mt-3 pt-3 border-t border-primary-border/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-secondary-light">
                    Выбрано: {Object.keys(selectedProducts).length} из{" "}
                    {DEMO_CATEGORIES.length}
                  </span>
                  <motion.span
                    className="text-sm font-medium text-white"
                    key={totalPrice}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                  >
                    {totalPrice.toLocaleString()} ₽
                  </motion.span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InteractiveConfigurator;
