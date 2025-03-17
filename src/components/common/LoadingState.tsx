import React from "react";

interface LoadingStateProps {
  isLoading?: boolean; // Делаем опциональным
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading = false, // Добавляем значение по умолчанию
  children,
  fallback,
}) => {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
};

export default LoadingState;
