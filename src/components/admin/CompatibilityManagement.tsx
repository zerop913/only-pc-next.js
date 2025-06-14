import { useState, useEffect } from "react";
import { 
  Settings2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  BarChart3,
  Filter
} from "lucide-react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Pagination from "@/components/common/ui/Pagination";
import Select from "@/components/common/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import AddCompatibilityRuleModal from "./modals/compatibility/AddCompatibilityRuleModal";
import EditCompatibilityRuleModal from "./modals/compatibility/EditCompatibilityRuleModal";
import DeleteCompatibilityRuleModal from "./modals/compatibility/DeleteCompatibilityRuleModal";
import CompatibilityRuleDetailsModal from "./modals/compatibility/CompatibilityRuleDetailsModal";

interface CompatibilityRule {
  id: number;
  name: string;
  description?: string;
  categories: Array<{
    id: number;
    primaryCategoryName: string;
    secondaryCategoryName: string;
  }>;
  characteristics: Array<{
    id: number;
    primaryCharacteristicName: string;
    secondaryCharacteristicName: string;
    comparisonType: string;
    valuesCount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function CompatibilityManagement() {
  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<CompatibilityRule | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);  const [filter, setFilter] = useState<"all" | "configured" | "needs_setup">("all");
  const [showStats, setShowStats] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
    // Состояния модальных окон
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [currentPage, debouncedSearch, filter]);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filter !== "all" && { filter }),
      });

      const response = await fetch(`/api/admin/compatibility/rules?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch compatibility rules");
      }
      
      const data = await response.json();
      setRules(data.rules || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (error) {
      console.error("Error fetching compatibility rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleClick = (rule: CompatibilityRule) => {
    setSelectedRule(rule);
    setShowDetailsModal(true);
  };

  const handleEditRule = (rule: CompatibilityRule) => {
    setSelectedRule(rule);
    setShowEditModal(true);
  };

  const handleDeleteRule = (rule: CompatibilityRule) => {
    setSelectedRule(rule);
    setShowDeleteModal(true);
  };

  const getComparisonTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      exact_match: "Точное совпадение",
      compatible_values: "Совместимые значения",
      contains: "Содержит",
      greater_than_or_equal: "Больше или равно",
      greater_than_or_equal_combined: "Больше или равно (суммарно)",
      frequency_match: "Совпадение частоты",
      backward_compatible: "Обратная совместимость",
      exists: "Существует",
      greater_than_zero: "Больше нуля",
      less_than_or_equal: "Меньше или равно",
      power_sufficient: "Достаточная мощность",
    };
    return labels[type] || type;
  };

  const getSeverityIcon = (hasCategories: boolean) => {
    return hasCategories ? (
      <CheckCircle className="w-4 h-4 text-green-400" />
    ) : (
      <XCircle className="w-4 h-4 text-orange-400" />
    );
  };

  const exportRules = async () => {
    try {
      const response = await fetch("/api/admin/compatibility/rules/export", {
        credentials: "include",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compatibility-rules-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting rules:", error);
    }
  };

  const importRules = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch("/api/admin/compatibility/rules/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error("Error importing rules:", error);
    }
  };

  const getFilteredCount = () => {
    switch (filter) {
      case "configured":
        return rules.filter(rule => rule.categories.length > 0 && rule.characteristics.length > 0).length;
      case "needs_setup":
        return rules.filter(rule => rule.categories.length === 0 || rule.characteristics.length === 0).length;
      default:
        return rules.length;    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и панель инструментов */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Управление совместимостью
          </h2>
          <p className="text-secondary-light text-sm">
            Настройка правил совместимости компонентов
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-from/10 hover:bg-gradient-from/20 text-secondary-light hover:text-white border border-primary-border transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4" />
            Статистика
          </button>
          
          <button
            onClick={exportRules}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-from/10 hover:bg-gradient-from/20 text-secondary-light hover:text-white border border-primary-border transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-from/10 hover:bg-gradient-from/20 text-secondary-light hover:text-white border border-primary-border transition-all duration-300 cursor-pointer">
            <Upload className="w-4 h-4" />
            Импорт
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && importRules(e.target.files[0])}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Добавить правило
          </button>
        </div>
      </div>

      {/* Статистика */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-from/10 border border-primary-border rounded-lg"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalItems}</div>
            <div className="text-sm text-secondary-light">Всего правил</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {rules.filter(rule => rule.categories.length > 0 && rule.characteristics.length > 0).length}
            </div>
            <div className="text-sm text-secondary-light">Настроенных</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {rules.filter(rule => rule.categories.length === 0 || rule.characteristics.length === 0).length}
            </div>
            <div className="text-sm text-secondary-light">Требуют настройки</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {rules.reduce((acc, rule) => acc + rule.characteristics.length, 0)}
            </div>
            <div className="text-sm text-secondary-light">Всего характеристик</div>
          </div>        </motion.div>
      )}

      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-light w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск правил совместимости..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light"
          />
        </div>        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary-light" />
          <Select
            value={filter}
            onChange={(value) => setFilter(value as typeof filter)}
            options={[
              { value: "all", label: "Все правила" },
              { value: "configured", label: "Настроенные" },
              { value: "needs_setup", label: "Требуют настройки" }
            ]}
          />
        </div>
      </div>

      {/* Список правил */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-secondary-light">
            <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Правила совместимости не найдены</p>
            {search && (
              <p className="text-sm mt-2">
                Попробуйте изменить поисковый запрос              </p>
            )}
          </div>
        ) : (
          <div>
            {rules.map((rule) => (              <div
                key={rule.id}
                className="bg-gradient-from/10 border border-primary-border rounded-lg p-4 hover:bg-gradient-from/20 transition-colors mb-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleRuleClick(rule)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(rule.categories.length > 0)}
                    <h3 className="text-white font-medium truncate">
                      {rule.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rule.categories.length > 0 && rule.characteristics.length > 0
                        ? "bg-green-500/20 text-green-300" 
                        : "bg-orange-500/20 text-orange-300"
                    }`}>
                      {rule.categories.length > 0 && rule.characteristics.length > 0 ? "Настроено" : "Требует настройки"}
                    </span>
                  </div>
                  
                  {rule.description && (
                    <p className="text-secondary-light text-sm mb-3 line-clamp-2">
                      {rule.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-light">Категории:</span>
                      <p className="text-white">
                        {rule.categories.length > 0 
                          ? `${rule.categories.length} пар(ы)`
                          : "Не настроены"
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-secondary-light">Характеристики:</span>
                      <p className="text-white">
                        {rule.characteristics.length > 0 
                          ? `${rule.characteristics.length} правил(а)`
                          : "Не настроены"
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-secondary-light">Обновлено:</span>
                      <p className="text-white">
                        {new Date(rule.updatedAt).toLocaleDateString('ru-RU')}                      </p>
                    </div>
                  </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleEditRule(rule);
                    }}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDeleteRule(rule);
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleRuleClick(rule);
                    }}
                    className="p-2 text-secondary-light hover:text-white hover:bg-gradient-from/20 rounded-lg transition-colors"                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Информация о результатах */}
      {!isLoading && rules.length > 0 && (        <div className="text-center text-secondary-light text-sm">
          Показано {rules.length} из {totalItems} правил
        </div>
      )}

      {/* Модальные окна */}
      {showAddModal && (
        <AddCompatibilityRuleModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchRules();
          }}
        />
      )}

      {showEditModal && selectedRule && (
        <EditCompatibilityRuleModal
          isOpen={showEditModal}
          rule={selectedRule}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRule(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRule(null);
            fetchRules();
          }}
        />
      )}

      {showDeleteModal && selectedRule && (
        <DeleteCompatibilityRuleModal
          isOpen={showDeleteModal}
          rule={selectedRule}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedRule(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setSelectedRule(null);
            fetchRules();
          }}
        />
      )}

      {showDetailsModal && selectedRule && (
        <CompatibilityRuleDetailsModal
          isOpen={showDetailsModal}
          rule={selectedRule}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRule(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
          onDelete={() => {
            setShowDetailsModal(false);
            setShowDeleteModal(true);
          }}
        />      )}
    </div>
  );
}
