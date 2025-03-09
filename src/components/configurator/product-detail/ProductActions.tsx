import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface ProductActionsProps {
  productId: number;
  onAddToConfiguration: (productId: number) => void;
}

export default function ProductActions({
  productId,
  onAddToConfiguration,
}: ProductActionsProps) {
  return (
    <div className="mt-6">
      <button
        onClick={() => onAddToConfiguration(productId)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
      >
        <PlusCircleIcon className="w-5 h-5 text-secondary-light group-hover/btn:text-white transition-colors" />
        <span className="text-secondary-light group-hover/btn:text-white transition-colors">
          Добавить в конфигурацию
        </span>
      </button>
    </div>
  );
}
