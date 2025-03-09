import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "@/contexts/AuthContext";
import { Lock, LogOut } from "lucide-react";
import Button from "@/components/common/Button/Button";
import { useAuth } from "@/contexts/AuthContext";
import ProfileSectionHeader from "./ProfileSectionHeader";

interface ProfileSecurityProps {
  user: User;
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Текущий пароль обязателен"),
    newPassword: z
      .string()
      .min(6, "Новый пароль должен содержать не менее 6 символов"),
    confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfileSecurity({ user }: ProfileSecurityProps) {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Пароль успешно изменен",
        });
        reset();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Произошла ошибка при изменении пароля",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Произошла ошибка при изменении пароля",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="p-6">
          <ProfileSectionHeader
            title="Изменение пароля"
            description="Обновите пароль для безопасности вашего аккаунта"
            icon={Lock}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <label
                htmlFor="currentPassword"
                className="block text-sm text-secondary-light"
              >
                Текущий пароль
              </label>
              <input
                {...register("currentPassword")}
                type="password"
                id="currentPassword"
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Введите текущий пароль"
              />
              {errors.currentPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="block text-sm text-secondary-light"
              >
                Новый пароль
              </label>
              <input
                {...register("newPassword")}
                type="password"
                id="newPassword"
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Введите новый пароль"
              />
              {errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-secondary-light"
              >
                Подтверждение пароля
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                id="confirmPassword"
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Подтвердите новый пароль"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="pt-2">
              <Button className="w-full justify-center" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Изменить пароль"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-gradient-from/10 border border-primary-border rounded-lg shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="p-6">
          <ProfileSectionHeader
            title="Безопасность аккаунта"
            description="Управление безопасностью вашего аккаунта"
            icon={LogOut}
          />

          <div className="space-y-6 mt-6">
            <div className="bg-gradient-from/20 border border-primary-border rounded-lg p-4">
              <h3 className="text-white font-medium">Управление сессиями</h3>
              <p className="text-secondary-light text-sm mt-2">
                Вы можете выйти из всех сессий на всех устройствах, нажав на
                кнопку ниже.
              </p>
              <div className="mt-4">
                <Button
                  onClick={handleLogout}
                  className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти из аккаунта
                </Button>
              </div>
            </div>

            <div className="bg-gradient-from/20 border border-primary-border rounded-lg p-4">
              <h3 className="text-white font-medium">Активные сессии</h3>
              <p className="text-secondary-light text-sm mt-2">
                Текущая сессия: {navigator.userAgent}
              </p>
              <p className="text-secondary-light text-sm mt-2">
                IP-адрес: Информация недоступна
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
