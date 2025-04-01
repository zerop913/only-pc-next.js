import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PcBuildResponse } from "@/types/pcbuild";

interface DeleteBuildModalProps {
  build: PcBuildResponse;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteBuildModal({
  build,
  onClose,
  onConfirm,
}: DeleteBuildModalProps) {
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
              Удаление сборки
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <p className="text-secondary-light mb-6">
            Вы уверены, что хотите удалить сборку "{build.name}"? Это действие
            нельзя отменить.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 
                       text-red-400 hover:text-red-300 border border-red-500/30 
                       hover:border-red-500/50 transition-all duration-300"
            >
              Удалить
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 
                       text-secondary-light hover:text-white border border-primary-border transition-all"
            >
              Отмена
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
