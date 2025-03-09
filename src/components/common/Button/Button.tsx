import { ElementType } from "react";

interface ButtonProps {
  children: React.ReactNode;
  icon?: ElementType;
  onClick?: () => void;
  isTablet?: boolean;
  className?: string;
  variant?: "default" | "mobile";
  disabled?: boolean;
}

const Button = ({
  children,
  icon: Icon,
  onClick,
  isTablet,
  className = "",
  variant = "default",
  disabled = false,
}: ButtonProps) => {
  if (variant === "mobile") {
    return (
      <button
        className={`w-full p-4 rounded-lg flex items-center justify-between
          bg-gradient-from/20 hover:bg-gradient-from/30
          text-secondary-light hover:text-white
          transition-all duration-200 border border-primary-border
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5" />}
          <span className="font-medium">{children}</span>
        </div>
      </button>
    );
  }

  return (
    <button
      className={`flex items-center px-2 sm:px-3 lg:px-4 py-2 rounded-lg 
        bg-gradient-from/20 hover:bg-gradient-from/30
        text-secondary-light hover:text-white
        transition-all duration-200 border border-primary-border
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${isTablet ? "md:text-xs lg:text-sm" : "text-sm"} 
        ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 
            ${isTablet ? "md:w-3 md:h-3 md:mr-1 lg:w-4 lg:h-4 lg:mr-2" : ""}`}
        />
      )}
      {children}
    </button>
  );
};

export default Button;
