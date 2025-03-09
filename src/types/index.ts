// Common component interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Layout specific interfaces
export interface LayoutProps extends BaseComponentProps {
  withHeader?: boolean;
}

// Button specific interfaces
export interface ButtonVariants {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

// Auth specific types
export type AuthStatus = "authenticated" | "unauthenticated" | "loading";
