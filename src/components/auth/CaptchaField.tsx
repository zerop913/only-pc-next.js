import React, { useEffect, useRef } from "react";

interface CaptchaFieldProps {
  onChange: (token: string | null) => void;
  error?: string;
}

interface ReCaptchaWindow extends Window {
  onRecaptchaLoad?: () => void;
  grecaptcha?: {
    render: (
      container: HTMLElement | string,
      params: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        size?: string;
        badge?: string;
      }
    ) => number;
    ready?: (callback: () => void) => void;
    execute?: (id: number) => Promise<void>;
    reset: (id: number) => void;
  };
}

export const CaptchaField: React.FC<CaptchaFieldProps> = ({
  onChange,
  error,
}) => {
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<number | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Проверяем, загружен ли уже скрипт reCAPTCHA
    const reCaptchaWindow = window as ReCaptchaWindow;

    if (typeof window !== "undefined" && !reCaptchaWindow.grecaptcha) {
      // Функция, которая будет вызвана после загрузки скрипта reCAPTCHA
      reCaptchaWindow.onRecaptchaLoad = () => {
        initializeCaptcha();
      };

      // Динамически добавляем скрипт reCAPTCHA
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      scriptRef.current = script;

      // Очистка при размонтировании компонента
      return () => {
        if (scriptRef.current && document.head.contains(scriptRef.current)) {
          document.head.removeChild(scriptRef.current);
        }
        if (reCaptchaWindow.onRecaptchaLoad) {
          reCaptchaWindow.onRecaptchaLoad = undefined;
        }
      };
    } else if (
      typeof window !== "undefined" &&
      reCaptchaWindow.grecaptcha &&
      typeof reCaptchaWindow.grecaptcha.render === "function"
    ) {
      // Если скрипт уже загружен, инициализируем капчу напрямую
      initializeCaptcha();
    } else if (
      typeof window !== "undefined" &&
      reCaptchaWindow.grecaptcha &&
      reCaptchaWindow.grecaptcha.ready
    ) {
      // Для версии reCAPTCHA v3
      reCaptchaWindow.grecaptcha.ready(() => {
        initializeCaptcha();
      });
    }
  }, []);

  // Функция для инициализации reCAPTCHA
  const initializeCaptcha = () => {
    const reCaptchaWindow = window as ReCaptchaWindow;

    if (
      captchaRef.current &&
      reCaptchaWindow.grecaptcha &&
      typeof reCaptchaWindow.grecaptcha.render === "function"
    ) {
      // Если виджет уже создан, сбросим его
      if (
        captchaWidgetId.current !== null &&
        typeof reCaptchaWindow.grecaptcha.reset === "function"
      ) {
        reCaptchaWindow.grecaptcha.reset(captchaWidgetId.current);
      } else {
        // Создаем новый виджет Invisible reCAPTCHA
        try {
          captchaWidgetId.current = reCaptchaWindow.grecaptcha.render(
            captchaRef.current,
            {
              sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
              callback: (token: string) => {
                console.log("Капча успешно пройдена!");
                onChange(token);
              },
              "expired-callback": () => onChange(null),
              size: "invisible",
              badge: "bottomleft", // Изменение расположения бейджа (или можно будет скрыть через CSS)
            }
          );

          // Автоматически выполняем капчу при загрузке страницы
          setTimeout(() => {
            if (
              captchaWidgetId.current !== null &&
              reCaptchaWindow.grecaptcha &&
              reCaptchaWindow.grecaptcha.execute
            ) {
              reCaptchaWindow.grecaptcha.execute(captchaWidgetId.current);
            }
          }, 1000);
        } catch (error) {
          console.error("Ошибка при рендеринге reCAPTCHA:", error);
        }
      }
    }
  };

  return (
    <div>
      {/* Скрытый контейнер для капчи */}
      <div
        ref={captchaRef}
        className="invisible"
        style={{ width: 0, height: 0 }}
      ></div>

      {/* Скрываем бейдж Google с помощью CSS */}
      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};
