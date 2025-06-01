import { useState, useEffect } from "react";
import { User } from "@/contexts/AuthContext";
import { Mail, Calendar, Hash, MapPin, User as UserIcon } from "lucide-react";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { fetchApi } from "../../utils/apiUtils";

interface ProfileInfoProps {
  user: User;
  profileUpdated?: number;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  city?: string;
  createdAt?: Date | string | null;
}

export default function ProfileInfo({
  user,
  profileUpdated = 0,
}: ProfileInfoProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchApi("/api/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          // Проверяем, есть ли данные в ответе и инициализируем пустым объектом, если нет
          setProfile(data && data.profile ? data.profile : {});
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Ошибка при загрузке профиля");
          // В случае ошибки устанавливаем пустой объект
          setProfile({});
        }
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
        setError("Ошибка при загрузке профиля");
        // В случае ошибки устанавливаем пустой объект
        setProfile({});
      } finally {
        setIsLoading(false);
      }
    }

    if (user && user.id) {
      fetchProfile();
    }
  }, [user?.id, profileUpdated]); // Добавляем profileUpdated в зависимости

  // Защита от null, используем пустой объект если профиль не загружен
  const safeProfile = profile || {};

  const fullName =
    safeProfile && (safeProfile.firstName || safeProfile.lastName)
      ? `${safeProfile.firstName || ""} ${safeProfile.lastName || ""}`.trim()
      : "Не указано";

  return (
    <div className="bg-gradient-from/10 border border-primary-border rounded-lg shadow-md relative overflow-hidden w-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
      <div className="p-6">
        <ProfileSectionHeader
          title="Информация профиля"
          description="Ваши личные данные и контактная информация"
          icon={UserIcon}
        />

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gradient-from/20 rounded w-3/4"></div>
            <div className="h-4 bg-gradient-from/20 rounded w-1/2"></div>
            <div className="h-4 bg-gradient-from/20 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-red-500/20 text-red-400 mt-4">
            {error}
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <div className="flex items-center p-3 border-b border-primary-border/30 group hover:bg-gradient-from/20 transition-colors rounded-md">
              <div className="p-2 bg-gradient-from/10 rounded-full mr-3">
                <UserIcon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-secondary-light">Полное имя</div>
                <div className="text-white">{fullName}</div>
              </div>
            </div>

            <div className="flex items-center p-3 border-b border-primary-border/30 group hover:bg-gradient-from/20 transition-colors rounded-md">
              <div className="p-2 bg-gradient-from/10 rounded-full mr-3">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-secondary-light">Email</div>
                <div className="text-white">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center p-3 border-b border-primary-border/30 group hover:bg-gradient-from/20 transition-colors rounded-md">
              <div className="p-2 bg-gradient-from/10 rounded-full mr-3">
                <Hash className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-secondary-light">Телефон</div>
                <div className="text-white">
                  {safeProfile.phoneNumber || "Не указан"}
                </div>
              </div>
            </div>

            <div className="flex items-center p-3 border-b border-primary-border/30 group hover:bg-gradient-from/20 transition-colors rounded-md">
              <div className="p-2 bg-gradient-from/10 rounded-full mr-3">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-secondary-light">Город</div>
                <div className="text-white">
                  {safeProfile.city || "Не указан"}
                </div>
              </div>
            </div>

            <div className="flex items-center p-3 group hover:bg-gradient-from/20 transition-colors rounded-md">
              <div className="p-2 bg-gradient-from/10 rounded-full mr-3">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-secondary-light">
                  Дата регистрации
                </div>
                <div className="text-white">
                  {safeProfile.createdAt
                    ? new Date(safeProfile.createdAt).toLocaleDateString(
                        "ru-RU"
                      )
                    : "Не указана"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
