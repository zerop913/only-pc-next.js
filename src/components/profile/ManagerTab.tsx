import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, KeyRound, ArrowRight } from "lucide-react";
import Button from "../common/Button/Button";
import { fetchApi } from "../../utils/apiUtils";

interface ApiResponse {
  success: boolean;
  error?: string;
}

export default function ManagerTab() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Проверяем пароль перед отправкой запроса
    if (!password.trim()) {
      setError("Пароль не может быть пустым");
      return;
    }

    setIsLoading(true);

    try {
      console.log(
        "Debug: Attempting manager verification with password:",
        password
      );
      const response = await fetchApi("/api/manager/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();

      // Проверяем статус ответа
      if (!response.ok) {
        if (response.status === 401) {
          // Неверный пароль или проблемы с токеном
          setError("Неверный пароль доступа");
          setPassword(""); // Очищаем поле пароля
        } else if (response.status === 403) {
          setError("У вас недостаточно прав для доступа к панели менеджера");
        } else {
          setError(data.error || "Произошла ошибка при проверке доступа");
        }
        return;
      }

      if (data.success) {
        // Успешная верификация
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.push("/manager");
      } else {
        setError("Непредвиденная ошибка при проверке доступа");
      }
    } catch (err) {
      console.error("Debug: Verification error:", err);
      setError("Произошла ошибка при проверке доступа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Доступ к панели менеджера
            </h2>
            <p className="text-secondary-light text-sm mt-1">
              Введите пароль доступа для входа в панель менеджера
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-secondary-light mb-2">
              Пароль доступа
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPassword((prev) => prev.trim())}
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-10"
                placeholder="Введите пароль доступа"
                autoComplete="off"
                autoFocus
                required
              />
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-secondary-light" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full justify-center group"
            disabled={isLoading}
          >
            <span className="flex items-center justify-center">
              {isLoading ? (
                "Проверка..."
              ) : (
                <>
                  Войти в панель менеджера
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
