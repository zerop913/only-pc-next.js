import { motion } from "framer-motion";
import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface SaveBuildModalProps {
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initialName?: string | null; // Обновляем тип здесь тоже для консистентности
  isEditing?: boolean;
}

export default function SaveBuildModal({
  onClose,
  onSave,
  initialName = "", // Оставляем пустую строку как значение по умолчанию
  isEditing = false,
}: SaveBuildModalProps) {
  const [name, setName] = useState(initialName || ""); // Используем пустую строку, если initialName null
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Введите название сборки");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onSave(name);
      router.push("/catalog");
    } catch (error: any) {
      console.error("Save error:", error);
      setError(error.message || "Ошибка при сохранении сборки");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-md bg-primary rounded-xl shadow-xl border border-primary-border"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? "Обновить сборку" : "Сохранить сборку"}
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="build-name"
                className="block text-sm text-secondary-light mb-2"
              >
                Название сборки
              </label>
              <input
                type="text"
                id="build-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isEditing}
                placeholder="Например: Игровой ПК 2025"
                className={`w-full px-4 py-3 rounded-lg bg-gradient-from/10 
                         border border-primary-border text-white 
                         placeholder:text-secondary-light/50
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20
                         ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              {isEditing && (
                <p className="mt-2 text-sm text-secondary-light">
                  Название можно изменить в профиле
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-b 
                         from-blue-500/10 to-blue-600/5 
                         hover:from-blue-500/20 hover:to-blue-600/10 
                         border border-blue-500/30 hover:border-blue-500/50 
                         font-medium transition-all duration-300 text-white
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg 
                         bg-gradient-from/20 hover:bg-gradient-from/30 
                         text-secondary-light hover:text-white 
                         border border-primary-border transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
