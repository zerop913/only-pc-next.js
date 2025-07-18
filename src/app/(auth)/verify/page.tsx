"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Button from "@/components/common/Button/Button";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    document.title = PAGE_TITLES.VERIFY;
  }, []);

  useEffect(() => {
    const email = sessionStorage.getItem("verificationEmail");
    if (!email) {
      router.push("/login");
      return;
    }

    // Проверяем, есть ли сохраненное время окончания в sessionStorage
    const endTime = sessionStorage.getItem("verificationEndTime");
    let initialTimeLeft = 300; // 5 минут по умолчанию (изменено с 3 на 5 минут)

    if (endTime) {
      const now = Math.floor(Date.now() / 1000); // текущее время в секундах
      const end = parseInt(endTime, 10);
      const remaining = end - now;

      // Если таймер еще не истек, используем оставшееся время
      if (remaining > 0) {
        initialTimeLeft = remaining;
        console.log(
          "Используем оставшееся время таймера:",
          remaining,
          "секунд"
        );
      } else {
        // Если таймер истек, удаляем его из хранилища
        sessionStorage.removeItem("verificationEndTime");
        console.log("Таймер истек, устанавливаем новый");
      }
    } else {
      // Если таймера нет, устанавливаем новый
      const newEndTime = Math.floor(Date.now() / 1000) + initialTimeLeft;
      sessionStorage.setItem("verificationEndTime", newEndTime.toString());
      console.log("Таймер не найден, устанавливаем новый на 5 минут");
    }

    setTimeLeft(initialTimeLeft);

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

  // Обработчик для ввода в поле для всех устройств
  const handleInputEvent = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLInputElement;
    const index = parseInt(target.dataset.index || "0", 10);
    const value = target.value;

    // Проверка на ввод числа
    if (/^\d$/.test(value)) {
      // Если введена цифра на мобильном устройстве, обрабатываем это здесь
      handleMobileDigitInput(index, value);
    }
  };

  // Специальный обработчик для ввода цифр на мобильных устройствах
  const handleMobileDigitInput = (index: number, value: string) => {
    // Обновляем текущее поле
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Если это не последнее поле, переходим к следующему
    if (index < 5) {
      // Используем setTimeout для мобильных устройств
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Для вставки нескольких цифр (например, при копировании кода)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").split("").slice(0, 6);

      // Заполняем поля кода
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 6) {
          newCode[i] = digit;
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

    // Обычный ввод одной цифры
    if (/^\d$/.test(value) || value === "") {
      // Обновляем текущее поле
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Если ввели цифру и это не последнее поле, переходим к следующему
      if (value && index < 5) {
        // Используем как requestAnimationFrame (для ПК), так и setTimeout (для мобильных)
        if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
          setTimeout(() => {
            inputRefs.current[index + 1]?.focus();
          }, 10);
        } else {
          requestAnimationFrame(() => {
            inputRefs.current[index + 1]?.focus();
          });
        }
      }
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Обработка Backspace
    if (e.key === "Backspace") {
      // Если текущее поле не пустое, просто очищаем его
      if (code[index] !== "") {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
      // Если текущее поле пустое и это не первое поле, переходим к предыдущему
      else if (index > 0) {
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
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
      const loginData = JSON.parse(sessionStorage.getItem("loginData") || "{}");

      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: loginData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка отправки кода");
      }

      // Устанавливаем таймер на 5 минут (300 секунд)
      const newEndTime = Math.floor(Date.now() / 1000) + 300;
      sessionStorage.setItem("verificationEndTime", newEndTime.toString());

      // Устанавливаем время ожидания и сбрасываем таймер
      setTimeLeft(300);

      console.log(
        "Код успешно отправлен повторно. Новый таймер установлен на 5 минут."
      );
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

      console.log("verify page - Starting verification:", {
        email,
        fullCode,
        codeLength: fullCode.length,
        codeArray: code,
      });

      if (!email) {
        throw new Error("Email для верификации не найден");
      }

      if (fullCode.length !== 6) {
        throw new Error("Код должен содержать 6 цифр");
      }

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: fullCode,
        }),
      });

      console.log("verify page - Response status:", response.status);

      const data = await response.json();
      console.log("verify page - Response data:", data);

      if (!response.ok) {
        throw new Error(
          data.error || `Ошибка проверки кода (${response.status})`
        );
      }

      console.log("verify page - Verification successful, redirecting...");

      // Очищаем sessionStorage и перенаправляем
      sessionStorage.removeItem("verificationEmail");
      sessionStorage.removeItem("loginData");
      sessionStorage.removeItem("verificationEndTime");
      window.location.href = "/profile";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Произошла ошибка";
      console.error("verify page - Verification error:", err);
      setError(errorMessage);
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
              type="tel"
              maxLength={1}
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              autoComplete="one-time-code"
              autoFocus={index === 0}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onInput={handleInputEvent}
              onPaste={handlePaste}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onFocus={(e) => (e.target as HTMLInputElement).select()}
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
