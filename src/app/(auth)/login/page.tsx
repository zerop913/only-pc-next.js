"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { CaptchaField } from "@/components/auth/CaptchaField";
import Button from "@/components/common/Button/Button";
import { useState, useEffect, useRef } from "react";

export default function LoginPage() {
  const { login, error, isLoading } = useAuth();
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

    const result = await login(data);

    if (!result.success) {
      captchaRef.current?.resetCaptcha();
      setValue("captchaToken", "");
      setCaptchaVerified(false);
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
