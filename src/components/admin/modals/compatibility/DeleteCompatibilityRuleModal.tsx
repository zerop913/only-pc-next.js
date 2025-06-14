import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";

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

interface DeleteCompatibilityRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: CompatibilityRule;
  onSuccess: () => void;
}

export default function DeleteCompatibilityRuleModal({
  isOpen,
  onClose,
  rule,
  onSuccess,
}: DeleteCompatibilityRuleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== rule.name) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/compatibility/rules/${rule.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete rule");
      }

      onSuccess();
    } catch (error) {
      console.error("Error deleting compatibility rule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md bg-primary rounded-xl shadow-xl border border-primary-border"
      >
        <div className="p-6">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Удалить правило
                </h3>
                <p className="text-sm text-secondary-light">
                  Это действие нельзя отменить
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Информация о правиле */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="mb-3">
              <h4 className="text-white font-medium">{rule.name}</h4>
              {rule.description && (
                <p className="text-secondary-light text-sm mt-1">
                  {rule.description}
                </p>
              )}
            </div>

            <div className="text-sm text-secondary-light space-y-1">
              <div>• {rule.categories.length} пар(ы) категорий</div>
              <div>• {rule.characteristics.length} правил(а) характеристик</div>
              <div>
                • Создано:{" "}
                {new Date(rule.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>

          {/* Предупреждение */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-orange-300 font-medium mb-1">Внимание!</p>
                <p className="text-secondary-light">
                  При удалении правила также будут удалены:
                </p>
                <ul className="text-secondary-light mt-2 space-y-1">
                  <li>• Все связанные пары категорий</li>
                  <li>• Все правила характеристик</li>
                  <li>• Все значения совместимости</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Подтверждение */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Для подтверждения введите название правила:{" "}
              <span className="text-red-400">{rule.name}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light focus:border-red-500/50"
              placeholder={rule.name}
              autoComplete="off"
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-secondary-light hover:text-white border border-primary-border hover:border-blue-500/30 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading || confirmText !== rule.name}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {isLoading ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
