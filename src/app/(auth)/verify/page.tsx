"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Button from "@/components/common/Button/Button";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const email = sessionStorage.getItem("verificationEmail");
    if (!email) {
      router.push("/login");
    }

    // Запускаем таймер
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // Обработчик для пользовательского ввода в любое поле
  const handleInputEvent = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLInputElement;
    const fieldIndex = parseInt(target.dataset.index || "0", 10);

    setTimeout(() => {
      let inputValue = target.value;

      // Если вставили или ввели несколько цифр сразу
      if (inputValue.length > 1) {
        // Разбиваем на отдельные цифры
        const digits = inputValue.replace(/\D/g, "").split("").slice(0, 6);

        // Распределяем цифры по полям
        const newCode = [...code];
        digits.forEach((digit, index) => {
          if (fieldIndex + index < 6) {
            newCode[fieldIndex + index] = digit;
          }
        });

        setCode(newCode);

        // Фокусируемся на следующем пустом поле или на последнем поле
        const nextEmptyIndex = newCode.findIndex((val) => val === "");
        if (nextEmptyIndex !== -1) {
          inputRefs.current[nextEmptyIndex]?.focus();
        } else {
          inputRefs.current[5]?.focus();
        }
      }
    }, 0);
  };

  const handleInputChange = (index: number, value: string) => {
    // Если вставлен весь код сразу
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").split("").slice(0, 6);
      const newCode = [...code];

      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });

      setCode(newCode);

      // Фокусируемся на следующем пустом поле или на последнем заполненном
      const nextEmptyIndex = newCode.findIndex((val) => val === "");
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    // Обработка ввода одной цифры
    const digit = value.slice(-1);
    if (!/^\d$/.test(digit) && digit !== "") {
      return;
    }

    setCode((prevCode) => {
      const newCode = [...prevCode];
      newCode[index] = digit;
      return newCode;
    });

    // Если ввели цифру, переходим к следующему полю
    if (digit && index < 5) {
      requestAnimationFrame(() => {
        inputRefs.current[index + 1]?.focus();
      });
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Обработка Backspace
    if (e.key === "Backspace") {
      e.preventDefault();

      setCode((prevCode) => {
        const newCode = [...prevCode];

        // Если текущее поле не пустое, просто очищаем его
        if (newCode[index] !== "") {
          newCode[index] = "";
          return newCode;
        }

        // Если текущее поле пустое, очищаем предыдущее и перемещаем фокус туда
        if (index > 0) {
          newCode[index - 1] = "";
          requestAnimationFrame(() => {
            inputRefs.current[index - 1]?.focus();
          });
        }

        return newCode;
      });
    }

    // Обработка стрелок для навигации между полями
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Обработчик вставки из буфера обмена
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").split("").slice(0, 6);

    if (digits.length > 0) {
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 6) {
          newCode[i] = digit;
        }
      });

      setCode(newCode);

      // Фокусируемся на следующем пустом поле или на последнем
      const nextEmptyIndex = newCode.findIndex((val) => val === "");
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      const email = sessionStorage.getItem("verificationEmail");

      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Ошибка отправки кода");
      }

      setTimeLeft(600);
      setError(null);
    } catch (err) {
      setError("Ошибка отправки кода. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const fullCode = code.join("");
      setIsLoading(true);
      setError(null);

      const email = sessionStorage.getItem("verificationEmail");
      const loginData = JSON.parse(sessionStorage.getItem("loginData") || "{}");

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: fullCode,
          loginData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка проверки кода");
      }

      // Очищаем sessionStorage и перенаправляем
      sessionStorage.removeItem("verificationEmail");
      sessionStorage.removeItem("loginData");
      window.location.href = "/profile";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setCode(["", "", "", "", "", ""]);
      // Фокусируемся на первой ячейке после ошибки
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AuthLayout title="Подтверждение входа">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-white font-medium">Введите код подтверждения</p>
          <p className="text-secondary-light text-sm">
            Мы отправили 6-значный код на вашу почту
          </p>
        </div>

        <div className="flex justify-center gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              id={`code-${index}`}
              data-index={index}
              type="text"
              maxLength={6}
              inputMode="numeric"
              value={digit}
              autoComplete="off"
              autoFocus={index === 0}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onInput={handleInputEvent}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-bold rounded-lg 
                       bg-gradient-from/10 border-2 border-primary-border text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <div className="text-center space-y-4">
          <Button
            onClick={handleSubmit}
            className="w-full justify-center"
            disabled={
              isLoading || code.some((digit) => !digit || digit.length !== 1)
            }
          >
            {isLoading ? "Проверка..." : "Подтвердить"}
          </Button>

          <div className="text-sm text-secondary-light">
            {timeLeft > 0 ? (
              <p>Отправить код повторно через {formatTime(timeLeft)}</p>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Отправить код повторно
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
