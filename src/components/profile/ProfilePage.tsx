"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileInfo from "./ProfileInfo";
import ProfileEditForm from "./ProfileEditForm";
import ProfileSecurity from "./ProfileSecurity";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/ui/tabs";
import { User, Shield, Settings, ShieldAlert, Package } from "lucide-react";
import AdminTab from "./AdminTab";
import ProfileBuilds from "./ProfileBuilds";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [mounted, setMounted] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(0);

  // Функция для обновления профиля
  const handleProfileUpdate = () => {
    setProfileUpdated((prev) => prev + 1);
  };

  // Предотвращаем изменение размеров при гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Ничего не рендерим на сервере, только на клиенте
  }

  if (!user) {
    return (
      <div className="p-6 backdrop-blur-sm bg-opacity-80 w-full">
        <div className="text-center py-8">
          <h2 className="text-xl text-white mb-2">Вы не авторизованы</h2>
          <p className="text-secondary-light">
            Пожалуйста, войдите в систему для доступа к профилю
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 backdrop-blur-none sm:backdrop-blur-sm duration-300 w-full max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          Личный кабинет
        </h1>
        <p className="text-secondary-light mt-2">
          Управляйте вашими личными данными и настройками аккаунта
        </p>
      </div>

      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6 w-full"
      >
        <TabsList className="flex md:inline-flex space-x-1 bg-gradient-from/10 border border-primary-border p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Профиль</span>
          </TabsTrigger>
          <TabsTrigger value="builds">
            <Package className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Мои сборки</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Безопасность</span>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Настройки</span>
          </TabsTrigger>
          {user.roleId === 1 && (
            <TabsTrigger value="admin">
              <ShieldAlert className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Админ панель</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <ProfileInfo
              user={user}
              key={`profile-info-${profileUpdated}`}
              profileUpdated={profileUpdated}
            />
            <ProfileEditForm
              user={user}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
        </TabsContent>

        <TabsContent value="builds" className="space-y-6 w-full">
          <ProfileBuilds />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 w-full">
          <ProfileSecurity user={user} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 w-full">
          <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
            <h2 className="text-xl font-semibold text-white mb-4">Настройки</h2>
            <p className="text-secondary-light">
              Раздел находится в разработке. Скоро здесь появятся дополнительные
              настройки аккаунта.
            </p>
          </div>
        </TabsContent>

        {user.roleId === 1 && (
          <TabsContent value="admin" className="space-y-6 w-full">
            <AdminTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
