import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Вызываем колбэк для логирования ошибки
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Логируем ошибку в консоль для разработки
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Используем кастомный fallback компонент, если он предоставлен
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Fallback по умолчанию
      return (
        <div className="min-h-screen bg-primary-dark flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto px-6">
            <h2 className="text-2xl text-white font-medium">
              Что-то пошло не так
            </h2>
            <p className="text-secondary-light/80">
              Произошла ошибка в приложении
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.resetError}
              className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 
                       border border-blue-500/30 text-blue-400 hover:text-blue-300 
                       rounded-xl transition-all duration-300"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
