"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Eye,
  Settings,
} from "lucide-react";
import { OrderWithRelations, DeliveryMethod } from "@/types/order";
import OrderDetailModal from "./OrderDetailModal";
import Notification, { NotificationType } from "@/components/common/Notification/Notification";
import ConfirmationModal from "@/components/admin/modals/ConfirmationModal";

interface DeliveryManagementProps {}

export default function DeliveryManagement({}: DeliveryManagementProps) {
  // Состояние для заказов в доставке
  const [deliveryOrders, setDeliveryOrders] = useState<OrderWithRelations[]>(
    []
  );
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Состояние для способов доставки
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  // Состояние формы
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    estimatedDays: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Состояние модального окна
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  // Состояние уведомлений
  const [notification, setNotification] = useState({
    isVisible: false,
    type: "success" as NotificationType,
    message: "",
  });

  // Состояние модального окна подтверждения удаления
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    method: null as DeliveryMethod | null,
  });

  // Загрузка заказов в доставке
  const fetchDeliveryOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch("/api/manager/delivery/orders");

      if (!response.ok) {
        throw new Error("Не удалось загрузить заказы в доставке");
      }

      const data = await response.json();

      if (data.success) {
        setDeliveryOrders(data.orders);
        setOrdersError(null);
      } else {
        throw new Error(data.error || "Ошибка при загрузке заказов");
      }
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Ошибка при загрузке заказов"
      );
      console.error("Ошибка загрузки заказов в доставке:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Загрузка способов доставки
  const fetchDeliveryMethods = async () => {
    try {
      setLoadingMethods(true);
      const response = await fetch("/api/manager/delivery-methods");

      if (!response.ok) {
        throw new Error("Не удалось загрузить способы доставки");
      }

      const data = await response.json();

      if (data.success) {
        setDeliveryMethods(data.deliveryMethods);
        setMethodsError(null);
      } else {
        throw new Error(data.error || "Ошибка при загрузке способов доставки");
      }
    } catch (err) {
      setMethodsError(
        err instanceof Error
          ? err.message
          : "Ошибка при загрузке способов доставки"
      );
      console.error("Ошибка загрузки способов доставки:", err);
    } finally {
      setLoadingMethods(false);
    }
  };
  useEffect(() => {
    fetchDeliveryOrders();
    fetchDeliveryMethods();
  }, []);

  // Функция для показа уведомлений
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      isVisible: true,
      type,
      message,
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };
  // Обработка отправки формы
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price.trim()) {
      showNotification("error", "Название и цена являются обязательными полями");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingMethod
        ? `/api/manager/delivery-methods/${editingMethod.id}`
        : "/api/manager/delivery-methods";

      const method = editingMethod ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchDeliveryMethods(); // Обновляем список
        handleCloseForm();
        showNotification(
          "success",
          data.message ||
            (editingMethod
              ? "Способ доставки обновлен"
              : "Способ доставки создан")
        );
      } else {
        throw new Error(data.error || "Ошибка при сохранении");
      }
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Ошибка при сохранении");
      console.error("Ошибка сохранения способа доставки:", err);
    } finally {
      setIsSubmitting(false);
    }
  };  // Обработка удаления способа доставки
  const handleDeleteMethod = (method: DeliveryMethod) => {
    setDeleteConfirmation({
      isOpen: true,
      method,
    });
  };

  // Подтверждение удаления способа доставки
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.method) return;

    try {
      const response = await fetch(
        `/api/manager/delivery-methods/${deleteConfirmation.method.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchDeliveryMethods(); // Обновляем список
        showNotification("success", data.message || "Способ доставки деактивирован");
      } else {
        throw new Error(data.error || "Ошибка при удалении");
      }
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Ошибка при удалении");
      console.error("Ошибка удаления способа доставки:", err);
    } finally {
      setDeleteConfirmation({ isOpen: false, method: null });
    }
  };

  // Открытие формы для создания
  const handleCreateMethod = () => {
    setEditingMethod(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      estimatedDays: "",
      isActive: true,
    });
    setIsFormOpen(true);
  };

  // Открытие формы для редактирования
  const handleEditMethod = (method: DeliveryMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || "",
      price: method.price,
      estimatedDays: method.estimatedDays || "",
      isActive: method.isActive,
    });
    setIsFormOpen(true);
  };

  // Закрытие формы
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMethod(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      estimatedDays: "",
      isActive: true,
    });
  };

  // Открытие модального окна заказа
  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  // Закрытие модального окна заказа
  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedOrderId(null);
    // Обновляем список заказов после закрытия модального окна
    fetchDeliveryOrders();
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Не указано";
    }
  };

  // Получение иконки статуса
  const getStatusIcon = (statusName: string) => {
    const statusLower = statusName.toLowerCase();
    if (statusLower.includes("отправ")) {
      return <Truck className="w-4 h-4 text-blue-400" />;
    } else if (statusLower.includes("достав")) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <Package className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between"></div>

      {/* Заказы в доставке */}
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-green-400" />
            Заказы в доставке ({deliveryOrders.length})
          </h3>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : ordersError ? (
          <div className="text-red-400 text-center p-4">{ordersError}</div>
        ) : deliveryOrders.length === 0 ? (
          <div className="text-center text-secondary-light p-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p>Нет заказов в доставке</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveryOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-from/5 border border-primary-border/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status?.name || "")}
                      <span className="text-sm text-white font-medium">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-secondary-light">
                      <User className="w-4 h-4" />
                      <span>
                        {order.user?.profile?.lastName}{" "}
                        {order.user?.profile?.firstName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-secondary-light">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>

                    <div className="text-sm">
                      <span className="text-white font-medium">
                        {parseFloat(order.totalPrice).toLocaleString()} ₽
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{
                          backgroundColor: order.status?.color || "#6B7280",
                        }}
                      >
                        {order.status?.name}
                      </span>
                    </div>

                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Подробнее
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Способы доставки */}
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Способы доставки
          </h3>
          <button
            onClick={handleCreateMethod}
            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить способ
          </button>
        </div>

        {loadingMethods ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : methodsError ? (
          <div className="text-red-400 text-center p-4">{methodsError}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deliveryMethods.map((method) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gradient-from/5 border rounded-lg p-4 ${
                  method.isActive
                    ? "border-primary-border/50"
                    : "border-red-500/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{method.name}</h4>
                    {method.description && (
                      <p className="text-sm text-secondary-light mt-1">
                        {method.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditMethod(method)}
                      className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method)}
                      className="p-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-light">Цена:</span>
                    <span className="text-sm text-white font-medium">
                      {parseFloat(method.price).toLocaleString()} ₽
                    </span>
                  </div>

                  {method.estimatedDays && (
                    <div className="flex justify-between">
                      <span className="text-sm text-secondary-light">
                        Доставка:
                      </span>
                      <span className="text-sm text-white">
                        {method.estimatedDays}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-light">
                      Статус:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        method.isActive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {method.isActive ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>      {/* Модальная форма создания/редактирования способа доставки */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 bg-primary rounded-xl shadow-xl border border-primary-border p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingMethod
                ? "Редактировать способ доставки"
                : "Создать способ доставки"}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Курьерская доставка"
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
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  placeholder="Краткое описание способа доставки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Цена *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Срок доставки
                </label>
                <input
                  type="text"
                  value={formData.estimatedDays}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedDays: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: 1-3 дня"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-primary-border text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-white">
                  Активный способ доставки
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-400 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Сохранение..."
                    : editingMethod
                      ? "Обновить"
                      : "Создать"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}      {/* Модальное окно деталей заказа */}
      {isOrderModalOpen && selectedOrderId && (
        <OrderDetailModal
          isOpen={isOrderModalOpen}
          onClose={handleCloseOrderModal}
          orderId={selectedOrderId}
        />
      )}      {/* Уведомления */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Модальное окно подтверждения удаления */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, method: null })}
        onConfirm={handleConfirmDelete}
        title="Подтверждение деактивации"
        message={`Вы уверены, что хотите деактивировать способ доставки "${deleteConfirmation.method?.name}"?`}
        confirmText="Деактивировать"
        cancelText="Отмена"
        type="warning"
      />
    </div>
  );
}
