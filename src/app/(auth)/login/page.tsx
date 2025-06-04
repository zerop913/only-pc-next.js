"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { CaptchaField } from "@/components/auth/CaptchaField";
import Button from "@/components/common/Button/Button";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  const captchaRef = useRef<{ resetCaptcha: () => void }>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      captchaToken: "",
    },
  });

  const handleCaptchaChange = (token: string | null) => {
    if (token) {
      setValue("captchaToken", token);
      setCaptchaVerified(true);
    } else {
      setValue("captchaToken", "");
      setCaptchaVerified(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!data.captchaToken) {
      captchaRef.current?.resetCaptcha();
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);

      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка отправки кода");
      }

      // Сохраняем данные для страницы верификации
      console.log("Saving login data to sessionStorage:", {
        email: data.email,
        passwordLength: data.password ? data.password.length : 0,
      });

      sessionStorage.setItem("verificationEmail", data.email);
      sessionStorage.setItem(
        "loginData",
        JSON.stringify({
          email: data.email,
          password: data.password,
          captchaToken: data.captchaToken,
        })
      );

      // Перенаправляем на страницу ввода кода
      router.push("/verify");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Произошла ошибка";
      setLocalError(errorMessage);
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Вход в OnlyPC"
      linkText="Создать аккаунт"
      linkHref="/register"
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

        <CaptchaField
          ref={captchaRef}
          onChange={handleCaptchaChange}
          onReset={() => {
            setValue("captchaToken", "");
            setCaptchaVerified(false);
          }}
        />

        {(error || localError) && (
          <div className="text-red-500 text-sm text-center mb-4">
            {error || localError}
          </div>
        )}

        <Button className="w-full mt-6 justify-center" disabled={isSubmitting}>
          {isSubmitting ? "Вход..." : "Войти"}
        </Button>
      </form>
    </AuthLayout>
  );
}
