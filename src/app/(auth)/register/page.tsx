"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { CaptchaField } from "@/components/auth/CaptchaField";
import Button from "@/components/common/Button/Button";
import { useState, useEffect } from "react";

export default function RegisterPage() {
  const { register: registerUser, error, isLoading } = useAuth();
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [captchaVerified, setCaptchaVerified] = useState(false);

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

  const onSubmit = (data: any) => {
    if (!data.captchaToken) {
      setCaptchaError("Пожалуйста, подтвердите, что вы не робот");
      return;
    }

    registerUser(data);
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
          onChange={handleCaptchaChange}
          error={captchaError || errors.captchaToken?.message?.toString()}
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
