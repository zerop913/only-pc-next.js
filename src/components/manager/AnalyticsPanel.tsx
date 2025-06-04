"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  TrendingUp,
  Download,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import type { AnalyticsData, CombinedDayData } from "@/types/analytics";
import Select from "@/components/common/ui/Select";

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#f472b6",
  "#38bdf8",
  "#facc15",
];

const PERIOD_OPTIONS = [
  { value: 7, label: "7 дней" },
  { value: 30, label: "30 дней" },
  { value: 90, label: "90 дней" },
  { value: 365, label: "1 год" },
];

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/manager/analytics?period=${period}`);        
        const json = await res.json();        
        if (json.success) {
          setData(json.analytics);
        } else {
          setError(json.error || "Ошибка загрузки аналитики");
        }
      } catch (e) {
        setError("Ошибка загрузки аналитики");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  // Объединяем данные по заказам и выручке по дням
  const combinedDayData = useMemo<CombinedDayData[]>(() => {
    if (!data) return [];
    
    const dateMap = new Map<string, CombinedDayData>();
    
    // Добавляем данные по заказам
    data.ordersByDay.forEach(order => {
      dateMap.set(order.date, { date: order.date, ordersCount: order.ordersCount, revenue: 0 });
    });
    
    // Добавляем данные по выручке
    data.revenueByDay.forEach(revenue => {
      const existing = dateMap.get(revenue.date);
      if (existing) {
        existing.revenue = revenue.revenue;
      } else {
        dateMap.set(revenue.date, { date: revenue.date, ordersCount: 0, revenue: revenue.revenue });
      }
    });
    
    // Сортируем по дате и ограничиваем количество точек для лучшей читаемости
    const sortedData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // Если данных слишком много, показываем каждый N-й день
    if (sortedData.length > 30) {
      const step = Math.ceil(sortedData.length / 30);
      return sortedData.filter((_, index) => index % step === 0);
    }
    
    return sortedData;
  }, [data]);

  const handleExport = () => {
    if (!data) return;

    const overviewData = [
      { Метрика: "Всего заказов", Значение: data.overview.totalOrders },
      { Метрика: "Общая выручка", Значение: data.overview.totalRevenue },
      {
        Метрика: "Уникальных клиентов",
        Значение: data.overview.totalCustomers,
      },
      { Метрика: "Средний чек", Значение: data.overview.averageOrder },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(overviewData),
      "Общие показатели"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.topProducts),
      "Топ товары"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.ordersByStatus),
      "По статусам"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.paymentMethods),
      "Способы оплаты"
    );

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `analytics-report-${period}days.xlsx`
    );
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Загрузка аналитики...</div>
    );
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!data) return null;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-7 h-7 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Аналитика и отчёты</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-[150px]">
            <Select
              value={period}
              onChange={(value) => setPeriod(Number(value))}
              options={PERIOD_OPTIONS}
              placeholder="Выберите период"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-white hover:bg-blue-500/30 transition-colors"
          >
            <Download className="w-5 h-5" />
            Выгрузить отчёт
          </button>
        </div>
      </div>

      {/* Общие показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-light text-sm">Всего заказов</p>
              <p className="text-2xl font-bold text-white">
                {data.overview.totalOrders}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-light text-sm">Общая выручка</p>
              <p className="text-2xl font-bold text-white">
                {data.overview.totalRevenue.toLocaleString("ru-RU")} ₽
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-light text-sm">Клиентов</p>
              <p className="text-2xl font-bold text-white">
                {data.overview.totalCustomers}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-light text-sm">Средний чек</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(data.overview.averageOrder).toLocaleString("ru-RU")}{" "}
                ₽
              </p>
            </div>
            <Package className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>      {/* Объединенный график: Заказы и выручка по дням */}
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Динамика заказов и выручки
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedDayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.getMonth() + 1;
                // Показываем только день и месяц для экономии места
                return `${day}.${month}`;
              }}
            />
            <YAxis yAxisId="orders" orientation="left" stroke="#60a5fa" />
            <YAxis yAxisId="revenue" orientation="right" stroke="#34d399" />            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#ffffff"
              }}
              labelStyle={{
                color: "#ffffff"
              }}
              itemStyle={{
                color: "#ffffff"
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
              }}
              formatter={(value: number, name: string) => {
                if (name === "ordersCount") {
                  return [`${value} заказов`, "Количество заказов"];
                }
                if (name === "revenue") {
                  return [`${value.toLocaleString("ru-RU")} ₽`, "Выручка"];
                }
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ color: "#94a3b8" }}
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="ordersCount"
              stroke="#60a5fa"
              strokeWidth={2}
              name="Заказы"
              dot={{ fill: "#60a5fa", strokeWidth: 2, r: 4 }}
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#34d399"
              strokeWidth={2}
              name="Выручка"
              dot={{ fill: "#34d399", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Статистика по статусам и топ товары */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Заказы по статусам */}
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Заказы по статусам
          </h3>          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ordersByStatus.filter(status => status.count > 0)}
                dataKey="count"
                nameKey="statusName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ statusName, count }) => count > 0 ? `${statusName}: ${count}` : null}
              >
                {data.ordersByStatus.filter(status => status.count > 0).map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.statusColor || COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>              
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#ffffff"
                }}
                itemStyle={{
                  color: "#ffffff"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Топ товары */}
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Топ товары</h3>
          <div className="space-y-3">
            {data.topProducts.slice(0, 5).map((product, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gradient-from/5 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{product.name}</p>
                  <p className="text-secondary-light text-sm">
                    Продано: {product.totalSold}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">
                    {product.totalRevenue.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>      
      {/* Способы оплаты */}
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Способы оплаты
        </h3>
        <div className="space-y-3">
          {data.paymentMethods.map((method, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-gradient-from/5 rounded-lg border border-primary-border/30"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-white font-medium">{method.method}</span>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{method.count} заказов</p>
                <p className="text-green-400 text-sm">
                  {method.totalAmount.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>
          ))}
          {data.paymentMethods.length === 0 && (
            <p className="text-secondary-light text-center py-4">
              Нет данных по способам оплаты
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
