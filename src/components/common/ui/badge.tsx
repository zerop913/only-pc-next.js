import * as React from "react";

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gradient-from/30 text-white border-primary-border/50",
  success: "bg-green-500/10 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  danger: "bg-red-500/10 text-red-400 border-red-500/30",
};

export const Badge = ({
  children,
  variant = "default",
  className,
  ...props
}: BadgeProps) => {
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
