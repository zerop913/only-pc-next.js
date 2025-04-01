import { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PcBuildResponse } from "@/types/pcbuild";

interface EditBuildNameModalProps {
  build: PcBuildResponse;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export default function EditBuildNameModal({
  build,
  onClose,
  onSave,
}: EditBuildNameModalProps) {
  const [name, setName] = useState(build.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-md bg-primary rounded-xl shadow-xl border border-primary-border"
        variants={{
          hidden: { opacity: 0, y: 20, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              Редактировать название
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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gradient-from/10 border border-primary-border 
                         text-white placeholder:text-secondary-light/50 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500/20"
                placeholder="Введите новое название"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-b from-blue-500/10 to-blue-600/5 
                         hover:from-blue-500/20 hover:to-blue-600/10 border border-blue-500/30 
                         hover:border-blue-500/50 text-white transition-all duration-300"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 
                         text-secondary-light hover:text-white border border-primary-border transition-all"
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
