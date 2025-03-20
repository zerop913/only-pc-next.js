import { useState, useEffect } from "react";
import { User } from "@/types/user";
import {
  Trash2,
  Edit2,
  AlertCircle,
  UserMinus,
  Info as InfoIcon,
  Users as UsersIcon,
} from "lucide-react";
import ConfirmationModal from "./modals/ConfirmationModal";
import EditUserModal from "./modals/EditUserModal";
import Notification from "@/components/common/Notification/Notification";
import UserDetailsModal from "./modals/UserDetailsModal";

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    userId?: number;
  }>({
    show: false,
  });

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const [editModal, setEditModal] = useState<{ show: boolean; user?: User }>({
    show: false,
  });

  const [detailsModal, setDetailsModal] = useState<{
    show: boolean;
    user?: User;
  }>({
    show: false,
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка загрузки пользователей"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (userId: number) => {
    setDeleteModal({ show: true, userId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.userId) return;

    try {
      const response = await fetch(`/api/admin/users/${deleteModal.userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении пользователя");
      }

      setUsers(users.filter((user) => user.id !== deleteModal.userId));
      setNotification({
        show: true,
        message: "Пользователь успешно удален",
        type: "success",
      });
    } catch (err) {
      setNotification({
        show: true,
        message: err instanceof Error ? err.message : "Произошла ошибка",
        type: "error",
      });
    } finally {
      setDeleteModal({ show: false });
      setTimeout(
        () => setNotification((prev) => ({ ...prev, show: false })),
        3000
      );
    }
  };

  const handleEditClick = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditModal({ show: true, user });
    }
  };

  const handleEditSave = async (updatedUser: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${editModal.user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error("Ошибка при обновлении пользователя");
      }

      const updatedData = await response.json();
      setUsers(
        users.map((user) =>
          user.id === editModal.user?.id ? { ...user, ...updatedData } : user
        )
      );

      setNotification({
        show: true,
        message: "Пользователь успешно обновлен",
        type: "success",
      });

      setEditModal({ show: false });

      // Добавляем таймер для скрытия уведомления
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
    } catch (err) {
      setNotification({
        show: true,
        message: err instanceof Error ? err.message : "Произошла ошибка",
        type: "error",
      });

      // Добавляем таймер для скрытия уведомления об ошибке
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  const deactivateInactiveUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/deactivate-inactive", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setNotification({
        show: true,
        message: data.message,
        type: "success",
      });

      // Обновляем список пользователей
      await fetchUsers();
    } catch (err) {
      setNotification({
        show: true,
        message: err instanceof Error ? err.message : "Произошла ошибка",
        type: "error",
      });
    } finally {
      setTimeout(
        () => setNotification((prev) => ({ ...prev, show: false })),
        3000
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse">Загрузка пользователей...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white">Пользователи</h2>
              <div className="px-2 py-0.5 text-sm bg-gradient-from/20 text-secondary-light rounded-md border border-primary-border">
                Всего: {users.length}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="h-4 w-px bg-primary-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-secondary-light">
                  Активных: {users.filter((u) => u.isActive).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm text-secondary-light">
                  Неактивных: {users.filter((u) => !u.isActive).length}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={deactivateInactiveUsers}
            className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 group"
          >
            <UserMinus className="w-4 h-4" />
            <span className="group-hover:underline underline-offset-4">
              Деактивировать неактивных
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-from/10 rounded-lg border border-primary-border/50">
          <InfoIcon className="w-5 h-5 text-blue-400" />
          <p className="text-sm text-secondary-light">
            Система автоматически деактивирует пользователей, которые не входили
            в систему более 90 дней
          </p>
        </div>
      </div>

      <div className="bg-gradient-from/10 border border-primary-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-from/30">
                <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                  Роль
                </th>
                <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                  Статус
                </th>
                <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-border/30">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gradient-from/20 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-white text-sm">{user.id}</td>
                  <td className="px-4 py-3 text-white text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${
                        user.roleId === 1
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {user.roleId === 1 ? "Администратор" : "Пользователь"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        user.isActive
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {user.isActive ? "Активен" : "Неактивен"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditClick(user.id)}
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10"
                        title="Редактировать"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDetailsModal({ show: true, user })}
                        className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors rounded-lg hover:bg-yellow-500/10"
                        title="Подробная информация"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false })}
        onConfirm={handleDeleteConfirm}
        title="Подтверждение удаления"
        message="Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить."
        type="danger"
      />

      {editModal.show && editModal.user && (
        <EditUserModal
          isOpen={editModal.show}
          onClose={() => setEditModal({ show: false })}
          onSave={handleEditSave}
          user={editModal.user}
        />
      )}

      {detailsModal.show && detailsModal.user && (
        <UserDetailsModal
          isOpen={detailsModal.show}
          onClose={() => setDetailsModal({ show: false })}
          user={detailsModal.user}
          onEdit={() => {
            setDetailsModal({ show: false });
            handleEditClick(detailsModal.user!.id);
          }}
        />
      )}

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
