import { useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { motion } from "framer-motion";

interface AuthFieldProps {
  type: string;
  label: string;
  name: string;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  placeholder?: string;
  className?: string;
}

export const AuthField = ({
  type,
  label,
  name,
  register,
  errors,
  placeholder,
  className = "",
}: AuthFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const uniqueId = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4 relative"
    >
      {" "}
      <label
        htmlFor={uniqueId}
        className="block text-xs sm:text-sm font-medium text-secondary-light mb-1.5 sm:mb-2 opacity-80"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type === "password" && showPassword ? "text" : type}
          id={uniqueId}
          placeholder={placeholder}
          autoComplete={type === "password" ? "new-password" : "off"}
          spellCheck="false"
          autoCorrect="off"
          className={`
            w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg 
            bg-gradient-from/10 
            border border-primary-border 
            text-white 
            placeholder-secondary-light/40 
            focus:outline-none focus:ring-1 focus:ring-blue-500/30
            transition-all duration-300
            text-xs sm:text-sm
            ${errors[name] ? "border-red-500" : ""}
            ${className}
          `}
          {...register(name)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-light hover:text-white"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-[10px] sm:text-xs text-red-500"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </motion.div>
  );
};
