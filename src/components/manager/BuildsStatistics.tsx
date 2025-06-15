"use client";

import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Calendar,
  Clock,
} from "lucide-react";
import Select from "@/components/common/ui/Select";

interface BuildStats {
  summary: {
    totalBuilds: number;
    soldBuilds: number;
    totalRevenue: number;
    avgPrice: number;
  };
  topBuilds: Array<{
    buildId: number;
    buildName: string;
    totalSales: number;
    totalRevenue: number;
  }>;
  priceRanges: Array<{
    range: string;
    count: number;
  }>;
  recentBuilds: Array<{
    id: number;
    name: string;
    totalPrice: number;
    createdAt: string;
  }>;
  period: string;
}

const PERIOD_OPTIONS = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
  { value: "all", label: "Все время" },
];

export default function BuildsStatistics() {
  const [stats, setStats] = useState<BuildStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/manager/builds/statistics?period=${period}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPeriodLabel = (periodValue: string) => {
    const labels = {
      week: "за неделю",
      month: "за месяц",
      year: "за год",
      all: "за все время",
    };
    return labels[periodValue as keyof typeof labels] || "за месяц";
  };

  if (isLoading) {
    return <div className="animate-pulse">Загрузка статистики...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="text-secondary-light">Нет данных для отображения</div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Фильтр по периоду */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          Статистика сборок {getPeriodLabel(period)}
        </h3>
        <div className="w-[150px]">
          <Select
            value={period}
            onChange={(value) => setPeriod(String(value))}
            options={PERIOD_OPTIONS}
            placeholder="Выберите период"
          />
        </div>
      </div>
      {/* Основная статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-secondary-light">Всего сборок</p>
              <p className="text-xl font-semibold text-white">
                {stats.summary.totalBuilds}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-secondary-light">Продано</p>
              <p className="text-xl font-semibold text-white">
                {stats.summary.soldBuilds}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-secondary-light">Общая выручка</p>
              <p className="text-xl font-semibold text-white">
                {formatPrice(stats.summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-secondary-light">Средняя цена</p>
              <p className="text-xl font-semibold text-white">
                {formatPrice(stats.summary.avgPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ популярных сборок */}
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Топ популярных сборок
          </h4>
          {stats.topBuilds.length > 0 ? (
            <div className="space-y-3">
              {stats.topBuilds.map((build, index) => (
                <div
                  key={build.buildId}
                  className="flex items-center justify-between p-3 bg-gradient-from/10 border border-primary-border/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {build.buildName}
                      </p>
                      <p className="text-xs text-secondary-light">
                        Продано: {build.totalSales} шт.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm">
                      {formatPrice(build.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-light text-center py-4">
              Нет данных о продажах {getPeriodLabel(period)}
            </p>
          )}
        </div>

        {/* Распределение по ценам */}
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Распределение по ценам
          </h4>
          <div className="space-y-3">
            {stats.priceRanges.map((range, index) => {
              const maxCount = Math.max(
                ...stats.priceRanges.map((r) => r.count)
              );
              const percentage =
                maxCount > 0 ? (range.count / maxCount) * 100 : 0;

              return (
                <div
                  key={range.range}
                  className="group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-secondary-light text-sm font-medium">
                      {range.range}
                    </span>
                    <span className="text-white font-semibold text-sm">
                      {range.count}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-2 bg-gradient-from/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {/* Процентный индикатор */}
                    <div
                      className="absolute top-0 h-2 w-0.5 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ left: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-secondary-light/70">
                      {maxCount > 0 ? Math.round(percentage) : 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Недавно созданные сборки */}
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Недавно созданные сборки
        </h4>
        {stats.recentBuilds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentBuilds.map((build, index) => (
              <div
                key={build.id}
                className="group relative bg-gradient-to-br from-gradient-from/20 to-gradient-to/5 border border-primary-border/50 rounded-lg p-4 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
              >
                {/* Номер сборки */}
                <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-semibold text-white">
                  {index + 1}
                </div>

                {/* Название сборки */}
                <h5 className="text-white font-semibold text-sm mb-2 pr-8 leading-tight group-hover:text-accent transition-colors">
                  {build.name}
                </h5>

                {/* Дата создания */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3 h-3 text-secondary-light" />
                  <p className="text-secondary-light text-xs">
                    {formatDate(build.createdAt)}
                  </p>
                </div>

                {/* Цена */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">
                      {formatPrice(build.totalPrice)}
                    </span>
                  </div>

                  {/* Индикатор новизны */}
                  <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md border border-blue-500/30">
                    Новая
                  </div>
                </div>

                {/* Hover эффект */}
                <div className="absolute inset-0 bg-gradient-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-secondary-light/50 mx-auto mb-3" />
            <p className="text-secondary-light">Нет недавно созданных сборок</p>
          </div>
        )}
      </div>
    </div>
  );
}
