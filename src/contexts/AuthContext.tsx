"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { LoginSchema, RegisterSchema } from "@/services/authService";

// Тип данных профиля пользователя
export interface Profile {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  city?: string;
}

// Тип данных пользователя
export interface User {
  id: number;
  email: string;
  roleId: number;
  isActive: boolean;
  profile?: Profile;
}

// Определяем типы для результатов операций
interface AuthResult {
  success: boolean;
  error?: string;
}

// Интерфейс контекста авторизации
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: User | null;
  error: string | null;
  login: (data: z.infer<typeof LoginSchema>) => Promise<AuthResult>;
  register: (data: z.infer<typeof RegisterSchema>) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setError: (error: string | null) => void; // Добавляем setError
  setIsLoading: (loading: boolean) => void; // Добавляем setIsLoading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          const isAdmin = data.user.roleId === 1;
          const isManager = data.user.roleId === 3;
          setUser({
            ...data.user,
            isAdmin,
            isManager,
          });
          console.log("Auth check successful:", {
            ...data.user,
            isAdmin,
            isManager,
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error("Ошибка проверки аутентификации:", err);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      const interval = setInterval(checkAuth, TOKEN_CHECK_INTERVAL);
      return () => clearInterval(interval);
    };

    initialize();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkAuth);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkAuth);
    };
  }, [checkAuth]);

  const login = async (
    data: z.infer<typeof LoginSchema>
  ): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ошибка входа");
      }

      await checkAuth();
      router.push("/configurator");
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    data: z.infer<typeof RegisterSchema>
  ): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ошибка регистрации");
      }

      router.push("/login");
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      // Перенаправляем напрямую на API-маршрут логаута
      window.location.href = "/logout";
    } catch (err) {
      console.error("Ошибка при выходе:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    error,
    login,
    register,
    logout,
    checkAuth,
    setError,
    setIsLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Хук для использования контекста авторизации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
