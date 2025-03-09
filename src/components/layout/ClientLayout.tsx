"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import LoadingState from "@/components/common/LoadingState";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isInitialized } = useAuth();

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Проверяем, что компонент смонтирован и информация об авторизации инициализирована
  const isLoading = !mounted || !isInitialized;

  return (
    <>
      {/* Header всегда отображается */}
      <Header />

      {/* Основной контент отображается, только когда все готово */}
      <main>
        <LoadingState
          isLoading={isLoading}
          fallback={
            <div className="flex justify-center items-center min-h-[calc(100vh-72px)]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          {children}
        </LoadingState>
      </main>
    </>
  );
}
