"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/ui/tabs";
import { Users, Package, FolderTree, Settings } from "lucide-react";
import UsersManagement from "@/components/admin/UsersManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-from/20 border border-primary-border rounded-xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Панель администратора
          </h1>
          <p className="text-secondary-light mt-2">
            Управление пользователями, товарами и категориями
          </p>
        </div>

        <Tabs
          defaultValue="users"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex md:inline-flex space-x-1 bg-gradient-from/10 border border-primary-border p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Пользователи</span>
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Товары</span>
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderTree className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Категории</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Управление пользователями
              </h2>
              <UsersManagement />
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Управление товарами
              </h2>
              <p className="text-secondary-light">
                Управление товарами в разработке...
              </p>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Управление категориями
              </h2>
              <CategoryManagement />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Настройки
              </h2>
              <p className="text-secondary-light">
                Настройки админ-панели в разработке...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
