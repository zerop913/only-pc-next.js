type LogLevel = "error" | "warn" | "info" | "debug";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  modules: {
    compatibility: boolean;
    configurator: boolean;
    api: boolean;
    general: boolean;
  };
}

// Конфигурация логгера
const config: LoggerConfig = {
  enabled: process.env.NODE_ENV === "development",
  level: "info",
  modules: {
    compatibility: process.env.NEXT_PUBLIC_DEBUG_COMPATIBILITY === "true",
    configurator: process.env.NEXT_PUBLIC_DEBUG_CONFIGURATOR === "true",
    api: process.env.NEXT_PUBLIC_DEBUG_API === "true",
    general: true,
  },
};

class DebugLogger {
  private isEnabled(module: keyof LoggerConfig["modules"]): boolean {
    return config.enabled && config.modules[module];
  }

  // Логирование для модуля совместимости
  compatibility = {
    log: (...args: any[]) => {
      if (this.isEnabled("compatibility")) {
        console.log("[COMPATIBILITY]", ...args);
      }
    },
    warn: (...args: any[]) => {
      if (this.isEnabled("compatibility")) {
        console.warn("[COMPATIBILITY]", ...args);
      }
    },
    error: (...args: any[]) => {
      // Ошибки всегда показываем
      console.error("[COMPATIBILITY]", ...args);
    },
  };

  // Логирование для конфигуратора
  configurator = {
    log: (...args: any[]) => {
      if (this.isEnabled("configurator")) {
        console.log("[CONFIGURATOR]", ...args);
      }
    },
    warn: (...args: any[]) => {
      if (this.isEnabled("configurator")) {
        console.warn("[CONFIGURATOR]", ...args);
      }
    },
    error: (...args: any[]) => {
      console.error("[CONFIGURATOR]", ...args);
    },
  };

  // Логирование для API
  api = {
    log: (...args: any[]) => {
      if (this.isEnabled("api")) {
        console.log("[API]", ...args);
      }
    },
    warn: (...args: any[]) => {
      if (this.isEnabled("api")) {
        console.warn("[API]", ...args);
      }
    },
    error: (...args: any[]) => {
      console.error("[API]", ...args);
    },
  };

  // Общее логирование
  general = {
    log: (...args: any[]) => {
      if (this.isEnabled("general")) {
        console.log("[GENERAL]", ...args);
      }
    },
    warn: (...args: any[]) => {
      if (this.isEnabled("general")) {
        console.warn("[GENERAL]", ...args);
      }
    },
    error: (...args: any[]) => {
      console.error("[GENERAL]", ...args);
    },
  };

  // Методы для управления конфигурацией
  enableModule(module: keyof LoggerConfig["modules"]) {
    config.modules[module] = true;
  }

  disableModule(module: keyof LoggerConfig["modules"]) {
    config.modules[module] = false;
  }

  setGlobalEnabled(enabled: boolean) {
    config.enabled = enabled;
  }

  getConfig(): LoggerConfig {
    return { ...config };
  }
}

export const debugLogger = new DebugLogger();

// Для удобства экспортируем отдельные логгеры
export const compatibilityLogger = debugLogger.compatibility;
export const configuratorLogger = debugLogger.configurator;
export const apiLogger = debugLogger.api;
export const generalLogger = debugLogger.general;
