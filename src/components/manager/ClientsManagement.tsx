"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import Select from "@/components/common/ui/Select";
import type { Client, SortOption, OrderStatusStat, RecentOrder } from "@/types/clients";

const SORT_OPTIONS: SortOption[] = [
  { value: "lastOrder_desc", label: "Сначала новые заказы" },
  { value: "lastOrder_asc", label: "Сначала старые заказы" },
  { value: "totalSpent_desc", label: "Больше всего потратили" },
  { value: "totalSpent_asc", label: "Меньше всего потратили" },
  { value: "totalOrders_desc", label: "Больше всего заказов" },
  { value: "totalOrders_asc", label: "Меньше всего заказов" },
];

export default function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortValue, setSortValue] = useState("lastOrder_desc");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  // Загрузка клиентов
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/manager/clients");

      if (!response.ok) {
        throw new Error("Не удалось загрузить список клиентов");
      }

      const data = await response.json();

      if (data.success) {
        setClients(data.clients);
        setError(null);
      } else {
        throw new Error(data.error || "Ошибка при загрузке клиентов");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при загрузке клиентов"
      );
      console.error("Ошибка загрузки клиентов:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Фильтрация и сортировка клиентов
  const filteredAndSortedClients = clients
    .filter((client) => {
      const searchLower = searchTerm.toLowerCase();
      const fullName =
        `${client.firstName || ""} ${client.lastName || ""}`.trim();
      return (
        fullName.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        (client.phone && client.phone.includes(searchTerm))
      );
    })
    .sort((a, b) => {
      const [sortBy, sortOrder] = sortValue.split("_");
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "lastOrder":
          aValue = new Date(a.lastOrderDate).getTime();
          bValue = new Date(b.lastOrderDate).getTime();
          break;
        case "totalSpent":
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case "totalOrders":
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

  // Форматирование цены
  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU") + " ₽";
  };

  // Получение имени клиента
  const getClientName = (client: Client) => {
    const fullName =
      `${client.firstName || ""} ${client.lastName || ""}`.trim();
    return fullName || "Не указано";
  };

  // Форматирование даты
  const formatDateString = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Не указано";
    }
  };

  // Переключение раскрытия деталей клиента
  const toggleClientExpanded = (clientId: number) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">
              Клиенты ({filteredAndSortedClients.length})
            </h3>
            <p className="text-sm text-secondary-light">Клиенты с заказами</p>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-light" />
          <input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <div className="w-[300px]">
          <Select
            value={sortValue}
            onChange={(value) => setSortValue(value.toString())}
            options={SORT_OPTIONS}
            placeholder="Сортировка"
          />
        </div>
      </div>

      {/* Список клиентов */}
      {filteredAndSortedClients.length === 0 ? (
        <div className="text-center text-secondary-light p-8 bg-gradient-from/5 border border-primary-border/50 rounded-lg">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p>Клиенты не найдены</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-from/5 border border-primary-border/50 rounded-lg overflow-hidden"
            >
              {/* Основная информация о клиенте */}
              <div
                className="p-4 cursor-pointer hover:bg-gradient-from/10 transition-colors"
                onClick={() => toggleClientExpanded(client.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                      <div>
                        <h4 className="text-white font-medium">
                          {getClientName(client)}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-secondary-light">
                          <Mail className="w-3 h-3" />
                          <span>{client.email}</span>
                        </div>
                      </div>

                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm text-secondary-light">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {client.totalOrders}
                      </div>
                      <div className="text-xs text-secondary-light">
                        заказов
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {formatPrice(client.totalSpent)}
                      </div>
                      <div className="text-xs text-secondary-light">
                        потрачено
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-white">
                        {formatDateString(client.lastOrderDate)}
                      </div>
                      <div className="text-xs text-secondary-light">
                        последний заказ
                      </div>
                    </div>

                    <button className="p-2 hover:bg-gradient-from/20 rounded-lg transition-colors">
                      {expandedClient === client.id ? (
                        <ChevronUp className="w-4 h-4 text-secondary-light" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-secondary-light" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Развернутая информация */}
              {expandedClient === client.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-primary-border/50 bg-gradient-from/3"
                >
                  <div className="p-4 space-y-4">
                    {/* Статистика по статусам заказов */}
                    <div>
                      <h5 className="text-sm font-medium text-white mb-2">
                        Статистика заказов по статусам:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {client.orderStatusStats.map((stat, index) => (
                          <div
                            key={index}
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: stat.statusColor || "#6B7280",
                            }}
                          >
                            {stat.statusName}: {stat.count}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Информация о клиенте */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-white">
                          Информация о клиенте:
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-secondary-light">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Первый заказ:{" "}
                              {formatDateString(client.firstOrderDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary-light">
                            <ShoppingBag className="w-3 h-3" />
                            <span>Всего заказов: {client.totalOrders}</span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary-light">
                            <CreditCard className="w-3 h-3" />
                            <span>
                              Средний чек:{" "}
                              {formatPrice(
                                client.totalSpent / client.totalOrders
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Последние заказы */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-white">
                          Последние заказы:
                        </h5>
                        <div className="space-y-1">
                          {client.recentOrders.slice(0, 3).map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-2 bg-gradient-from/10 rounded border border-primary-border/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-medium">
                                  #{order.orderNumber}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-medium text-white"
                                  style={{
                                    backgroundColor:
                                      order.statusColor || "#6B7280",
                                  }}
                                >
                                  {order.statusName}
                                </span>
                              </div>
                              <div className="text-sm text-white">
                                {formatPrice(parseFloat(order.totalPrice))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
