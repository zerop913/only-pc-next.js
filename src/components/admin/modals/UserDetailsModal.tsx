import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { InfoIcon, AlertCircle } from "lucide-react";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onEdit: () => void;
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit,
}: UserDetailsModalProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkOnlineStatus = async () => {
      try {
        const response = await fetch(`/api/admin/users/${user.id}/online`);
        const data = await response.json();
        setIsOnline(data.isOnline);
      } catch (error) {
        console.error("Error checking online status:", error);
      }
    };

    if (isOpen) {
      checkOnlineStatus();
      intervalId = setInterval(checkOnlineStatus, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen, user.id]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";

    const dateObj = new Date(date);

    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
      hour12: false,
    }).format(dateObj);
  };

  // Функция для расчета количества дней неактивности
  const calculateInactiveDays = (): {
    days: number;
    isNearDeactivation: boolean;
  } => {
    if (!user.lastLoginAt || isOnline) {
      return { days: 0, isNearDeactivation: false };
    }

    const lastLogin = new Date(user.lastLoginAt);
    const now = new Date();

    const differenceInTime = now.getTime() - lastLogin.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    // Проверяем, приближается ли пользователь к порогу деактивации (90 дней)
    const isNearDeactivation = differenceInDays >= 60 && differenceInDays < 90;

    return { days: differenceInDays, isNearDeactivation };
  };

  const { days: inactiveDays, isNearDeactivation } = calculateInactiveDays();

  // Функция для склонения существительного "день" в зависимости от числа
  const formatDaysText = (days: number): string => {
    if (days === 0) return "менее 1 дня";

    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return `${days} дней`;
    } else if (lastDigit === 1) {
      return `${days} день`;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return `${days} дня`;
    } else {
      return `${days} дней`;
    }
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
        className="relative z-10 w-full max-w-2xl bg-primary rounded-xl shadow-xl border border-primary-border"
      >
        <div className="p-6">
          {/* Заголовок */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Информация о пользователе
              </h2>
              <p className="text-sm text-secondary-light">ID: {user.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Личные данные */}
            <div className="p-4 bg-gradient-from/10 rounded-lg border border-primary-border">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Личные данные
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-secondary-light">Email</span>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary-light">Имя</span>
                    <p className="text-white">{user.firstName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary-light">
                      Фамилия
                    </span>
                    <p className="text-white">{user.lastName || "-"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-secondary-light">
                      Телефон
                    </span>
                    <p className="text-white">{user.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary-light">Город</span>
                    <p className="text-white">{user.city || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Статус и роль */}
            <div className="p-4 bg-gradient-from/10 rounded-lg border border-primary-border">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                Статус и роль
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-secondary-light">Роль</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${
                        user.roleId === 1
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          : user.roleId === 3
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {user.roleId === 1 
                        ? "Администратор" 
                        : user.roleId === 3 
                        ? "Менеджер" 
                        : "Пользователь"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-secondary-light">
                    Статус аккаунта
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${
                        user.isActive
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {user.isActive ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* История активности */}
            <div className="p-4 bg-gradient-from/10 rounded-lg border border-primary-border">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                История активности
              </h3>
              <div className="grid gap-3">
                <div>
                  <span className="text-sm text-secondary-light">
                    Дата регистрации
                  </span>
                  <p className="text-white">{formatDate(user.createdAt)}</p>
                </div>
                {user.updatedAt && (
                  <div>
                    <span className="text-sm text-secondary-light">
                      Последнее обновление
                    </span>
                    <p className="text-white">{formatDate(user.updatedAt)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-secondary-light">Статус</span>
                  {isOnline ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <p className="text-green-400">Сейчас в сети</p>
                    </div>
                  ) : (
                    <p className="text-white">
                      {user.lastLoginAt
                        ? `Был в сети ${formatDate(user.lastLoginAt)}`
                        : "Не заходил"}
                    </p>
                  )}
                </div>

                {/* Добавляем блок с информацией о неактивности */}
                {!isOnline && user.lastLoginAt && (
                  <div>
                    <span className="text-sm text-secondary-light">
                      Период неактивности
                    </span>
                    <div className="mt-1">
                      {inactiveDays > 0 && (
                        <div
                          className={`flex items-center gap-2 ${
                            isNearDeactivation ? "text-amber-400" : "text-white"
                          }`}
                        >
                          {isNearDeactivation && (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          )}
                          <span>{formatDaysText(inactiveDays)}</span>
                          {isNearDeactivation && (
                            <span className="text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              Приближается к деактивации
                            </span>
                          )}
                        </div>
                      )}
                      {user.roleId !== 1 && (
                        <p className="text-xs text-secondary-light mt-1">
                          Автоматическая деактивация через {90 - inactiveDays}{" "}
                          дней неактивности
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="flex gap-3">
              <button
                onClick={onEdit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all duration-300"
              >
                Редактировать профиль
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white border border-primary-border transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
