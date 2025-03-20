import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { User } from "@/types/user";
import Select from "@/components/common/ui/Select";
import Checkbox from "@/components/common/ui/Checkbox";
import { InfoIcon } from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
  user: User;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSave,
  user,
}: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phoneNumber: user.phoneNumber || "",
    city: user.city || "",
    isActive: user.isActive,
    roleId: user.roleId,
  });

  useEffect(() => {
    setFormData({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      city: user.city || "",
      isActive: user.isActive,
      roleId: user.roleId,
    });
  }, [user]);

  const roleOptions = [
    { value: 2, label: "Пользователь" },
    { value: 1, label: "Администратор" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsLoading(false);
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
                Редактирование пользователя
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Личные данные */}
            <div className="p-4 bg-gradient-from/10 rounded-lg border border-primary-border">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Личные данные
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-secondary-light">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-light">Имя</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-light">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-secondary-light">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-light">
                      Город
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                    />
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
                <div className="space-y-2">
                  <label className="text-sm text-secondary-light">
                    Роль пользователя
                  </label>
                  <Select
                    value={formData.roleId}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        roleId: Number(value),
                      }))
                    }
                    options={roleOptions}
                  />
                </div>
                <div className="flex items-center justify-start h-[68px]">
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                    label="Пользователь активен"
                  />
                </div>
              </div>
            </div>

            {/* Действия */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all duration-300"
              >
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white border border-primary-border transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
