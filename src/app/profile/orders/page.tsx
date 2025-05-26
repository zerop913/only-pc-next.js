"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем пользователя на страницу профиля с вкладкой заказов
    router.push("/profile?tab=orders");
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
