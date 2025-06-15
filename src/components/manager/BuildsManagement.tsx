"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Filter,
  Package,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import Button from "@/components/common/Button/Button";
import BuildDetailModal from "./BuildDetailModal";

interface Build {
  id: number;
  name: string;
  slug: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  components: Record<string, any>;
  customerName: string;
  userId: number;
  userEmail: string;
}

interface BuildsResponse {
  builds: Build[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default function BuildsManagement() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuild, setSelectedBuild] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const fetchBuilds = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(priceFilter.min && { priceMin: priceFilter.min }),
        ...(priceFilter.max && { priceMax: priceFilter.max }),
      });

      const response = await fetch(`/api/manager/builds?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch builds");
      }

      const data: BuildsResponse = await response.json();
      setBuilds(data.builds);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error("Error fetching builds:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleViewBuild = (buildId: number) => {
    setSelectedBuild(buildId);
    setShowDetailModal(true);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const countComponents = (components: Record<string, any>) => {
    if (!components) return 0;
    // Если это уже массив компонентов (из API), возвращаем его длину
    if (Array.isArray(components)) return components.length;
    // Если это объект с ID/slug компонентов, считаем непустые значения
    if (typeof components === "object") {
      return Object.values(components).filter(
        (value) => value !== null && value !== undefined && value !== ""
      ).length;
    }
    // Если это строка, пытаемся распарсить JSON
    if (typeof components === "string") {
      try {
        const parsed = JSON.parse(components);
        return Object.values(parsed).filter(
          (value) => value !== null && value !== undefined && value !== ""
        ).length;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchBuilds();
  };

  const clearFilters = () => {
    setPriceFilter({ min: "", max: "" });
    setSearchQuery("");
    setCurrentPage(1);
    fetchBuilds();
  };

  if (isLoading && builds.length === 0) {
    return <div className="animate-pulse">Загрузка сборок...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }
  return (
    <div className="space-y-4">
      {/* Заголовок и быстрая статистика */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white">Сборки ПК</h2>
              <div className="px-2 py-0.5 text-sm bg-gradient-from/20 text-secondary-light rounded-md border border-primary-border">
                Всего: {totalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-light w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск по названию сборки..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-from/20 hover:bg-gradient-from/30 border border-primary-border rounded-lg text-secondary-light hover:text-white transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              Фильтры
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Расширенные фильтры */}
        {showFilters && (
          <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-light mb-2">
                  Цена от
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={priceFilter.min}
                  onChange={(e) =>
                    setPriceFilter({ ...priceFilter, min: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-light mb-2">
                  Цена до
                </label>
                <input
                  type="number"
                  placeholder="999999"
                  value={priceFilter.max}
                  onChange={(e) =>
                    setPriceFilter({ ...priceFilter, max: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder-secondary-light focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-gradient-primary hover:bg-gradient-primary/80 text-white rounded-lg transition-colors duration-200"
                >
                  Применить
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gradient-from/20 hover:bg-gradient-from/30 border border-primary-border text-secondary-light hover:text-white rounded-lg transition-colors duration-200"
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Таблица сборок */}
      {builds.length === 0 ? (
        <div className="text-center py-12 bg-gradient-from/10 border border-primary-border rounded-lg">
          <Package className="w-12 h-12 text-secondary-light mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Сборки не найдены
          </h3>
          <p className="text-secondary-light">
            {searchQuery
              ? "Попробуйте изменить параметры поиска"
              : "В данный момент сборок нет"}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-from/30">
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Название
                      {sortBy === "name" && (
                        <ChevronDown
                          className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Автор
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    <button
                      onClick={() => handleSort("totalPrice")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Цена
                      {sortBy === "totalPrice" && (
                        <ChevronDown
                          className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Компонентов
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Дата создания
                      {sortBy === "createdAt" && (
                        <ChevronDown
                          className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-secondary-light font-medium text-sm">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-border/30">
                {builds.map((build) => (
                  <tr
                    key={build.id}
                    className="hover:bg-gradient-from/20 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 text-white text-sm font-medium">
                      {build.name}
                    </td>
                    <td className="px-4 py-3 text-white text-sm">
                      {build.customerName}
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-medium">
                      {formatPrice(build.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-secondary-light text-sm">
                      {countComponents(build.components)} шт.
                    </td>
                    <td className="px-4 py-3 text-secondary-light text-sm">
                      {formatDate(build.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewBuild(build.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-from/20 hover:bg-gradient-from/30 border border-primary-border rounded-lg text-secondary-light hover:text-white transition-colors duration-200"
                      >
                        <Eye className="w-3 h-3" />
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-primary-border/30 flex items-center justify-between">
              <div className="text-sm text-secondary-light">
                Показаны {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} из {totalCount} сборок
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gradient-from/20 hover:bg-gradient-from/30 border border-primary-border rounded-lg text-secondary-light hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-gradient-from/20 hover:bg-gradient-from/30 border border-primary-border rounded-lg text-secondary-light hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Далее
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Модальное окно с детальной информацией */}
      {showDetailModal && selectedBuild && (
        <BuildDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBuild(null);
          }}
          buildId={selectedBuild}
        />
      )}
    </div>
  );
}
