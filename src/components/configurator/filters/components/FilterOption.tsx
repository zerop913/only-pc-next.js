import { CheckIcon } from "@heroicons/react/24/outline";
import { FilterOption as FilterOptionType } from "../types/filters";

interface FilterOptionProps {
  option: FilterOptionType;
  isSelected: boolean;
  onChange: () => void;
}

export default function FilterOption({
  option,
  isSelected,
  onChange,
}: FilterOptionProps) {
  // Определяем, доступна ли опция (количество больше 0 или опция уже выбрана)
  const isAvailable = option.count > 0 || isSelected;

  return (
    <label
      className={`flex items-center gap-3 group hover:bg-gradient-from/10 
        ${!isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={isAvailable ? onChange : undefined}
        disabled={!isAvailable && !isSelected}
        className="hidden"
      />
      <div
        className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
          isSelected
            ? "bg-blue-500 border-blue-500"
            : `border-primary-border bg-gradient-from/20 ${isAvailable ? "group-hover:border-blue-400" : ""}`
        }`}
      >
        {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
      </div>
      <span
        className={`text-sm transition-colors flex-1 flex justify-between items-center ${
          isSelected
            ? "text-white"
            : `text-secondary-light ${isAvailable ? "group-hover:text-white" : ""}`
        }`}
      >
        <span>{option.label}</span>
        <span
          className={`text-xs ${option.count === 0 && !isSelected ? "text-red-400" : "text-secondary-light"}`}
        >
          {option.count}
        </span>
      </span>
    </label>
  );
}
