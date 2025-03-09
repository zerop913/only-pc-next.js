"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { CaptchaField } from "@/components/auth/CaptchaField";
import Button from "@/components/common/Button/Button";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { login, error, isLoading } = useAuth();
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [captchaVerified, setCaptchaVerified] = useState(false);

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
      setCaptchaError(undefined);
      setCaptchaVerified(true);
      console.log("Капча верифицирована в компоненте логина");
    } else {
      setValue("captchaToken", "");
      setCaptchaError("Пожалуйста, подтвердите, что вы не робот");
      setCaptchaVerified(false);
    }
  };

  const onSubmit = (data: any) => {
    if (!data.captchaToken) {
      setCaptchaError("Пожалуйста, подтвердите, что вы не робот");
      return;
    }

    login(data);
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
          onChange={handleCaptchaChange}
          error={captchaError || errors.captchaToken?.message?.toString()}
        />

        {error && (
          <div className="text-red-500 text-sm text-center mb-4">{error}</div>
        )}

        <Button className="w-full mt-6 justify-center" disabled={isLoading}>
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </form>
    </AuthLayout>
  );
}
