import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "@/contexts/AuthContext";
import { Edit2 } from "lucide-react";
import Button from "@/components/common/Button/Button";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { fetchApi } from "../../utils/apiUtils";
import { IMaskInput } from "react-imask";

interface ProfileEditFormProps {
  user: User;
  onProfileUpdate: () => void;
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
    .min(10, "Введите полный номер телефона")
    .regex(
      /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
      "Некорректный формат номера телефона"
    )
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
    control,
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
        const response = await fetchApi("/api/profile", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Добавляем проверку, существует ли data.profile
          if (data && data.profile) {
            // Для номера телефона форматируем его, если он существует, но не в нужном формате
            let phoneNumber = data.profile.phoneNumber || "";

            // Если номер телефона не соответствует маске, но является корректным номером
            if (
              phoneNumber &&
              !phoneNumber.match(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/)
            ) {
              // Удаляем все нецифры, кроме + в начале
              const digitsOnly = phoneNumber.replace(/[^\d+]/g, "");

              // Если номер не начинается с +7, добавляем префикс
              if (!digitsOnly.startsWith("+7")) {
                // Удаляем + если он есть
                const withoutPlus = digitsOnly.replace(/^\+/, "");

                // Если начинается с 7, оставляем, иначе добавляем 7
                phoneNumber = withoutPlus.startsWith("7")
                  ? `+${withoutPlus}`
                  : `+7${withoutPlus}`;
              } else {
                phoneNumber = digitsOnly;
              }
            }

            reset({
              ...data.profile,
              phoneNumber,
            });
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

  // Функция для очистки номера телефона от форматирования
  const cleanPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return "";

    // Удаляем все символы, кроме цифр и знака +
    const cleaned = phone.replace(/[^\d+]/g, "");

    if (cleaned.startsWith("+7")) {
      return cleaned;
    }

    if (cleaned.startsWith("7")) {
      return "+" + cleaned;
    }

    return "+7" + cleaned;
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setMessage(null);
    try {
      // Очищаем номер телефона от форматирования перед отправкой
      const cleanedData = {
        ...data,
        phoneNumber: cleanPhoneNumber(data.phoneNumber),
      };

      console.log("Отправка номера телефона:", cleanedData.phoneNumber);

      const response = await fetchApi("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
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
        console.error("Ошибка обновления профиля:", result);
        setMessage({
          type: "error",
          text: result.error || "Произошла ошибка при обновлении профиля",
        });
      }
    } catch (error) {
      console.error("Ошибка при запросе на обновление профиля:", error);
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
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <IMaskInput
                  mask="+{7} (000) 000-00-00"
                  definitions={{
                    "#": /[1-9]/,
                  }}
                  type="tel"
                  id="phoneNumber"
                  value={field.value || ""}
                  onAccept={(value) => field.onChange(value)}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="+7 (___) ___-__-__"
                  unmask={false}
                />
              )}
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
