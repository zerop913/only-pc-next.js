"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  User,
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Monitor,
} from "lucide-react";
import Button from "@/components/common/Button/Button";
import { getImageUrl } from "@/lib/utils/imageUtils";

// Компонент для отображения изображения продукта с fallback
const ProductImage = ({
  src,
  alt,
  categorySlug,
  getCategoryIcon,
}: {
  src: string | null;
  alt: string;
  categorySlug: string;
  getCategoryIcon: (slug: string) => React.ReactNode;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <div className="w-12 h-12 bg-gradient-from/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-sm">
      {src && !imageError ? (
        <>
          <img
            src={getImageUrl(src)}
            alt={alt}
            className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 w-full h-full bg-gradient-from/30 rounded-lg flex items-center justify-center animate-pulse">
              {getCategoryIcon(categorySlug)}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-gradient-from/30 rounded-lg flex items-center justify-center">
          {getCategoryIcon(categorySlug)}
        </div>
      )}
    </div>
  );
};

interface BuildComponent {
  id: number;
  title: string;
  price: string;
  brand: string;
  image: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
}

interface RecentOrder {
  orderId: number;
  orderNumber: string;
  createdAt: string;
  totalPrice: number;
  customerName: string;
}

interface BuildDetail {
  id: number;
  name: string;
  slug: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  userEmail: string;
  components: BuildComponent[];
  stats: {
    totalSales: number;
    totalRevenue: number;
  };
  recentOrders: RecentOrder[];
}

interface BuildDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildId: number;
}

export default function BuildDetailModal({
  isOpen,
  onClose,
  buildId,
}: BuildDetailModalProps) {
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && buildId) {
      fetchBuildDetails(buildId);
    }
  }, [isOpen, buildId]);

  const fetchBuildDetails = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/manager/builds/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch build details");
      }

      const data = await response.json();
      setBuild(data.build);
    } catch (err) {
      console.error("Error fetching build details:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = (categorySlug: string) => {
    const icons: Record<string, React.ReactNode> = {
      processory: <Monitor className="w-4 h-4" />,
      videokarty: <Monitor className="w-4 h-4" />,
      "materinskie-platy": <Package className="w-4 h-4" />,
      "operativnaya-pamyat": <Package className="w-4 h-4" />,
      nakopiteli: <Package className="w-4 h-4" />,
      "bloki-pitaniya": <Package className="w-4 h-4" />,
      korpusa: <Package className="w-4 h-4" />,
      "sistemy-ohlazhdeniya": <Package className="w-4 h-4" />,
    };
    return icons[categorySlug] || <Package className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 bg-primary rounded-lg shadow-2xl border border-primary-border w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col mx-4"
            variants={{
              hidden: { opacity: 0, scale: 0.95, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0 },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Заголовок модального окна */}
            <div className="flex justify-between items-center border-b border-primary-border p-5">
              <h3 className="text-xl font-semibold text-white">
                {isLoading
                  ? "Загрузка данных сборки..."
                  : build
                    ? `Сборка: ${build.name}`
                    : "Детали сборки"}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded-full text-secondary-light hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Содержимое модального окна */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Уведомления об ошибках */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center"
                  >
                    <X className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-red-400 font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Индикатор загрузки */}
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="animate-spin w-10 h-10 border-3 border-primary-border border-t-blue-500 rounded-full mb-3"></div>
                  <p className="text-secondary-light">
                    Загрузка информации о сборке...
                  </p>
                </motion.div>
              ) : !error && build ? (
                <div className="space-y-6">
                  {/* Основная информация о сборке */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-gradient-from/20 to-gradient-to/5 rounded-lg p-4 border border-primary-border"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Название сборки */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                          <Package className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Название
                          </p>
                          <p className="text-white font-medium text-sm truncate">
                            {build.name}
                          </p>
                        </div>
                      </div>

                      {/* Автор */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                          <User className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Автор
                          </p>
                          <p className="text-white font-medium text-sm truncate">
                            {build.customerName}
                          </p>
                          <p className="text-secondary-light text-xs truncate">
                            {build.userEmail}
                          </p>
                        </div>
                      </div>

                      {/* Цена */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Стоимость
                          </p>
                          <p className="text-white font-medium text-sm">
                            {formatPrice(build.totalPrice)}
                          </p>
                        </div>
                      </div>

                      {/* Дата создания */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                          <Calendar className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Создана
                          </p>
                          <p className="text-white font-medium text-sm">
                            {formatDate(build.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Статистика продаж */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-from/10 border border-primary-border rounded-lg p-4"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Статистика продаж
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gradient-from/10 rounded-lg border border-primary-border/50">
                        <div className="text-2xl font-bold text-white">
                          {build.stats.totalSales}
                        </div>
                        <div className="text-sm text-secondary-light">
                          Продано
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gradient-from/10 rounded-lg border border-primary-border/50">
                        <div className="text-2xl font-bold text-white">
                          {formatPrice(build.stats.totalRevenue)}
                        </div>
                        <div className="text-sm text-secondary-light">
                          Выручка
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gradient-from/10 rounded-lg border border-primary-border/50">
                        <div className="text-2xl font-bold text-white">
                          {build.stats.totalSales > 0
                            ? formatPrice(
                                build.stats.totalRevenue /
                                  build.stats.totalSales
                              )
                            : "—"}
                        </div>
                        <div className="text-sm text-secondary-light">
                          Средний чек
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Компоненты сборки */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-from/10 border border-primary-border rounded-lg p-4"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Компоненты ({build.components.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {build.components.map((component) => (
                        <div
                          key={component.id}
                          className="flex items-center justify-between p-3 bg-gradient-from/10 border border-primary-border/50 rounded-lg hover:bg-gradient-from/20 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <ProductImage
                              src={component.image}
                              alt={component.title}
                              categorySlug={component.categorySlug}
                              getCategoryIcon={getCategoryIcon}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium text-sm">
                                {component.title}
                              </p>
                              <p className="text-xs text-secondary-light">
                                {component.categoryName} • {component.brand}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-medium text-sm">
                              {formatPrice(parseFloat(component.price))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Последние заказы */}
                  {build.recentOrders.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-from/10 border border-primary-border rounded-lg p-4"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Последние заказы
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {build.recentOrders.map((order) => (
                          <div
                            key={order.orderId}
                            className="flex items-center justify-between p-3 bg-gradient-from/10 border border-primary-border/50 rounded-lg hover:bg-gradient-from/20 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-medium text-sm">
                                  {order.orderNumber}
                                </p>
                                <p className="text-xs text-secondary-light">
                                  {order.customerName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-white font-medium text-sm">
                                {formatPrice(order.totalPrice)}
                              </p>
                              <p className="text-xs text-secondary-light">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">{error}</div>
                  <Button onClick={() => fetchBuildDetails(buildId)}>
                    Повторить попытку
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
