"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button/Button";
import { KeyRound } from "lucide-react";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function ManagerVerification() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    document.title = "Верификация менеджера - " + PAGE_TITLES.MANAGER;
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Пароль не может быть пустым");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/manager/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка верификации");
        return;
      }

      // Успешная верификация - показываем сообщение и перенаправляем
      setTimeout(() => {
        // Перенаправление в панель менеджера
        router.push("/manager");
      }, 1000);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Произошла ошибка при проверке доступа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-from/20 border border-primary-border mb-6">
          <KeyRound className="w-8 h-8 text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 text-center">
          Доступ менеджера
        </h1>
        <p className="text-secondary-light mb-6 text-center">
          Введите пароль менеджера для доступа к панели управления
        </p>

        {error && (
          <div className="w-full p-4 mb-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="w-full space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Пароль доступа"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full justify-center group"
            disabled={isLoading}
          >
            <span className="flex items-center justify-center">
              {isLoading ? "Проверка..." : "Подтвердить доступ"}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
