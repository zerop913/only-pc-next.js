import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, KeyRound, ArrowRight } from "lucide-react";
import Button from "../common/Button/Button";

interface ApiResponse {
  success: boolean;
  error?: string;
}

export default function AdminTab() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log(
        "Debug: Attempting admin verification with password:",
        password
      );
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();
      console.log("Debug: Server response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Ошибка доступа");
      }

      if (data.success) {
        console.log("Debug: Verification successful");
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.push("/admin");
      } else {
        throw new Error("Неожиданный ответ от сервера");
      }
    } catch (err) {
      console.error("Debug: Verification error:", err);
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при верификации"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Доступ к панели администратора
            </h2>
            <p className="text-secondary-light text-sm mt-1">
              Введите пароль доступа для входа в админ-панель
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
                className="w-full px-4 py-2 rounded-lg bg-gradient-from/20 border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-10"
                placeholder="Введите пароль доступа"
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
                  Войти в админ-панель
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
