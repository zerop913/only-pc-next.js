"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useSearchParams } from "next/navigation";
import ProfileInfo from "./ProfileInfo";
import ProfileEditForm from "./ProfileEditForm";
import ProfileSecurity from "./ProfileSecurity";
import ProfileOrders from "./ProfileOrders";
import CookieSettingsContent from "./CookieSettingsContent";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/ui/tabs";
import {
  User,
  Shield,
  Settings,
  ShieldAlert,
  Package,
  Briefcase,
  ShoppingBag,
} from "lucide-react";
import AdminTab from "./AdminTab";
import ManagerTab from "./ManagerTab";
import ProfileBuilds from "./ProfileBuilds";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState("profile");
  const [mounted, setMounted] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(0);

  // Функция для обновления профиля
  const handleProfileUpdate = () => {
    setProfileUpdated((prev) => prev + 1);
  };

  // Устанавливаем активную вкладку из URL-параметра
  useEffect(() => {
    if (
      tabParam &&
      [
        "profile",
        "orders",
        "builds",
        "security",
        "settings",
        "admin",
        "manager",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
          <TabsTrigger value="orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Заказы</span>
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
          {user.roleId === 3 && (
            <TabsTrigger value="manager">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Панель менеджера</span>
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

        <TabsContent value="orders" className="space-y-6 w-full">
          <ProfileOrders />
        </TabsContent>

        <TabsContent value="builds" className="space-y-6 w-full">
          <ProfileBuilds />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 w-full">
          <ProfileSecurity user={user} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 w-full">
          <CookieSettingsContent />
        </TabsContent>

        {user.roleId === 1 && (
          <TabsContent value="admin" className="space-y-6 w-full">
            <AdminTab />
          </TabsContent>
        )}

        {user.roleId === 3 && (
          <TabsContent value="manager" className="space-y-6 w-full">
            <ManagerTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
