"use client";

import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/ui/tabs";
import {
  ShoppingBag,
  Package,
  Users,
  Settings,
  TrendingUp,
} from "lucide-react";

import OrdersManagement from "@/components/manager/OrdersManagement";
import DeliveryManagement from "@/components/manager/DeliveryManagement";
import ClientsManagement from "@/components/manager/ClientsManagement";
import AnalyticsPanel from "@/components/manager/AnalyticsPanel";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function ManagerPanel() {
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    document.title = PAGE_TITLES.MANAGER;
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-from/20 border border-primary-border rounded-xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Панель менеджера
          </h1>
          <p className="text-secondary-light mt-2">
            Управление заказами, статусами доставки и клиентами
          </p>
        </div>

        <Tabs
          defaultValue="orders"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex md:inline-flex space-x-1 bg-gradient-from/10 border border-primary-border p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            <TabsTrigger value="orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Заказы</span>
            </TabsTrigger>
            <TabsTrigger value="delivery">
              <Package className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Доставка</span>
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Клиенты</span>
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Аналитика</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Управление заказами
              </h2>
              <OrdersManagement />
            </div>
          </TabsContent>

          <TabsContent value="delivery">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Управление доставкой
              </h2>
              <DeliveryManagement />
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Управление клиентами
              </h2>
              <ClientsManagement />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <AnalyticsPanel />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Настройки
              </h2>
              <p className="text-secondary-light">
                Настройки панели менеджера в разработке...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
