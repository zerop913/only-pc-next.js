import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  id,
}: CheckboxProps) {
  return (
    <div className="flex items-center">
      <label className="relative flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          id={id}
        />
        <div
          className={`
          w-5 h-5 border-2 rounded transition-all duration-200
          ${
            checked
              ? "bg-blue-500/20 border-blue-500/50"
              : "bg-gradient-from/20 border-primary-border"
          }
        `}
        >
          <Check
            className={`
            w-4 h-4 text-blue-400 transition-all duration-200
            ${checked ? "opacity-100 scale-100" : "opacity-0 scale-90"}
          `}
          />
        </div>
        {label && <span className="ml-2 text-white">{label}</span>}
      </label>
    </div>
  );
}
