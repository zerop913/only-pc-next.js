import React from "react";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
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
