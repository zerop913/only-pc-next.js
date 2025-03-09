import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "@/contexts/AuthContext";
import { Edit2 } from "lucide-react";
import Button from "@/components/common/Button/Button";
import ProfileSectionHeader from "./ProfileSectionHeader";

interface ProfileEditFormProps {
  user: User;
  onProfileUpdate: () => void; // Добавляем обработчик для обновления состояния родителя
}

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "Имя должно содержать не менее 2 символов")
    .optional(),
  lastName: z
    .string()
    .min(2, "Фамилия должна содержать не менее 2 символов")
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Некорректный номер телефона")
    .optional(),
  city: z
    .string()
    .min(2, "Город должен содержать не менее 2 символов")
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditForm({
  user,
  onProfileUpdate,
}: ProfileEditFormProps) {
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
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      city: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Добавляем проверку, существует ли data.profile
          if (data && data.profile) {
            reset(data.profile);
          } else {
            // Если профиль не найден, установим пустой объект
            reset({
              firstName: "",
              lastName: "",
              phoneNumber: "",
              city: "",
            });
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    }

    fetchProfile();
  }, [reset, user.id]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
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
          text: "Профиль успешно обновлен",
        });

        // Вызываем функцию обновления родительского компонента
        onProfileUpdate();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Произошла ошибка при обновлении профиля",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Произошла ошибка при обновлении профиля",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-from/10 border border-primary-border rounded-lg shadow-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
      <div className="p-6">
        <ProfileSectionHeader
          title="Редактировать профиль"
          description="Обновите свои личные данные"
          icon={Edit2}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm text-secondary-light"
              >
                Имя
              </label>
              <input
                {...register("firstName")}
                type="text"
                id="firstName"
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Введите имя"
              />
              {errors.firstName && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm text-secondary-light"
              >
                Фамилия
              </label>
              <input
                {...register("lastName")}
                type="text"
                id="lastName"
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Введите фамилию"
              />
              {errors.lastName && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phoneNumber"
              className="block text-sm text-secondary-light"
            >
              Телефон
            </label>
            <input
              {...register("phoneNumber")}
              type="text"
              id="phoneNumber"
              className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="+7XXXXXXXXXX"
            />
            {errors.phoneNumber && (
              <p className="text-red-400 text-xs mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="city"
              className="block text-sm text-secondary-light"
            >
              Город
            </label>
            <input
              {...register("city")}
              type="text"
              id="city"
              className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Введите город"
            />
            {errors.city && (
              <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>
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
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
