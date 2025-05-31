"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CookieSettings {
  functional: boolean;
  analytical: boolean;
}

interface CookieContextType {
  settings: CookieSettings;
  updateSettings: (newSettings: Partial<CookieSettings>) => void;
  isInitialized: boolean;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CookieSettings>({
    functional: true,
    analytical: true,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем настройки при первой загрузке
  useEffect(() => {
    const loadSettings = () => {
      const functionalSetting = localStorage.getItem("functionalCookies");
      const analyticalSetting = localStorage.getItem("analyticalCookies");

      const newSettings = {
        functional:
          functionalSetting === null ? true : functionalSetting === "true",
        analytical:
          analyticalSetting === null ? true : analyticalSetting === "true",
      };

      setSettings(newSettings);
      setIsInitialized(true);

      // Применяем настройки
      applySettings(newSettings);
    };

    loadSettings();
  }, []);

  // Функция для применения настроек cookies
  const applySettings = (newSettings: CookieSettings) => {
    // Функциональные cookies
    if (newSettings.functional) {
      // Включаем функциональные cookies
      document.cookie = "cookieControl=functional; path=/; max-age=31536000"; // 1 год
    } else {
      // Отключаем функциональные cookies
      document.cookie = "cookieControl=functional; path=/; max-age=0";
    }

    // Аналитические cookies
    if (newSettings.analytical) {
      // Включаем аналитику (например, Google Analytics)
      document.cookie = "cookieControl=analytical; path=/; max-age=31536000";
      window.localStorage.setItem("analyticsEnabled", "true");
    } else {
      // Отключаем аналитику
      document.cookie = "cookieControl=analytical; path=/; max-age=0";
      window.localStorage.setItem("analyticsEnabled", "false");
    }

    // Генерируем событие для других частей приложения
    const event = new CustomEvent("cookieSettingsChanged", {
      detail: { settings: newSettings },
    });
    document.dispatchEvent(event);
  };

  const updateSettings = (newSettings: Partial<CookieSettings>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
    };

    // Сохраняем в localStorage
    if (newSettings.functional !== undefined) {
      localStorage.setItem("functionalCookies", String(newSettings.functional));
    }
    if (newSettings.analytical !== undefined) {
      localStorage.setItem("analyticalCookies", String(newSettings.analytical));
    }

    // Обновляем состояние
    setSettings(updatedSettings);

    // Применяем новые настройки
    applySettings(updatedSettings);
  };

  return (
    <CookieContext.Provider
      value={{
        settings,
        updateSettings,
        isInitialized,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export const useCookie = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error("useCookie must be used within a CookieProvider");
  }
  return context;
};
