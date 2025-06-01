"use client";

import { useEffect } from "react";

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Обработчик для unhandled promise rejection
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Проверяем, связана ли ошибка с reCAPTCHA
      if (
        event.reason === null ||
        (typeof event.reason === "string" &&
          event.reason.includes("reCAPTCHA")) ||
        (event.reason &&
          event.reason.message &&
          event.reason.message.includes("reCAPTCHA"))
      ) {
        // Предотвращаем вывод ошибки в консоль для reCAPTCHA
        event.preventDefault();
        console.warn("reCAPTCHA promise rejection handled:", event.reason);
        return;
      }

      // Логируем другие ошибки, но не показываем их пользователю
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };

    // Обработчик для обычных JavaScript ошибок
    const handleError = (event: ErrorEvent) => {
      // Проверяем, связана ли ошибка с reCAPTCHA
      if (
        event.error === null ||
        (event.message && event.message.includes("reCAPTCHA")) ||
        (event.filename && event.filename.includes("recaptcha"))
      ) {
        // Предотвращаем вывод ошибки в консоль для reCAPTCHA
        event.preventDefault();
        console.warn("reCAPTCHA error handled:", event.error);
        return;
      }

      // Логируем другие ошибки
      console.error("JavaScript error:", event.error);
    };

    // Добавляем обработчики событий
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
