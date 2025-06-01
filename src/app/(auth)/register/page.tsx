"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { CaptchaField } from "@/components/auth/CaptchaField";
import Button from "@/components/common/Button/Button";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../../../utils/apiUtils";

export default function RegisterPage() {
  const { error, isLoading, setIsLoading, setError } = useAuth();
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  const captchaRef = useRef<{ resetCaptcha: () => void }>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      captchaToken: "",
    },
  });

  const handleCaptchaChange = (token: string | null) => {
    if (token) {
      setValue("captchaToken", token);
      setCaptchaError(undefined);
      setCaptchaVerified(true);
      console.log("Капча верифицирована в компоненте регистрации");
    } else {
      setValue("captchaToken", "");
      setCaptchaError("Пожалуйста, подтвердите, что вы не робот");
      setCaptchaVerified(false);
    }
  };
  const onSubmit = async (data: any) => {
    if (!data.captchaToken) {
      setCaptchaError("Пожалуйста, подтвердите, что вы не робот");
      return;
    }
    try {
      setIsLoading(true);
      setError(null); // Очищаем предыдущие ошибки

      const response = await fetchApi("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ошибка регистрации");
      }

      // Сохраняем данные для верификации
      sessionStorage.setItem("verificationEmail", data.email);
      sessionStorage.setItem(
        "loginData",
        JSON.stringify({
          email: data.email,
          password: data.password,
        })
      );

      // Перенаправляем на страницу верификации
      router.push("/verify");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Произошла ошибка";
      setError(errorMessage);
      console.error("Registration submission error:", error);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Добавляем сообщение в консоль для отслеживания
  useEffect(() => {
    console.log(
      "Состояние проверки капчи:",
      captchaVerified ? "Верифицирована" : "Не верифицирована"
    );
  }, [captchaVerified]);

  return (
    <AuthLayout
      title="Регистрация в OnlyPC"
      linkText="Уже есть аккаунт? Войти"
      linkHref="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          type="email"
          label="Email"
          name="email"
          register={register}
          errors={errors}
          placeholder="example@mail.com"
        />

        <AuthField
          type="password"
          label="Пароль"
          name="password"
          register={register}
          errors={errors}
          placeholder="Введите пароль"
        />

        <AuthField
          type="password"
          label="Подтверждение пароля"
          name="confirmPassword"
          register={register}
          errors={errors}
          placeholder="Введите пароль"
        />

        <CaptchaField
          ref={captchaRef}
          onChange={handleCaptchaChange}
          onReset={() => {
            setValue("captchaToken", "");
            setCaptchaVerified(false);
          }}
        />

        {error && (
          <div className="text-red-500 text-sm text-center mb-4">{error}</div>
        )}

        <Button className="w-full mt-6 justify-center" disabled={isLoading}>
          {isLoading ? "Регистрация..." : "Создать аккаунт"}
        </Button>
      </form>
    </AuthLayout>
  );
}
