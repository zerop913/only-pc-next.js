import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

interface CaptchaFieldProps {
  onChange: (token: string | null) => void;
  onReset?: () => void;
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
        "error-callback"?: () => void;
        size?: string;
        badge?: string;
      }
    ) => number;
    ready?: (callback: () => void) => void;
    execute?: (id: number) => Promise<void>;
    reset: (id: number) => void;
  };
}

export const CaptchaField = forwardRef<
  { resetCaptcha: () => void },
  CaptchaFieldProps
>(({ onChange, onReset }, ref) => {
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<number | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const resetCaptcha = useCallback(() => {
    const reCaptchaWindow = window as ReCaptchaWindow;
    const grecaptcha = reCaptchaWindow?.grecaptcha;

    if (captchaWidgetId.current !== null && grecaptcha?.reset) {
      grecaptcha.reset(captchaWidgetId.current);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Увеличиваем задержку перед повторным выполнением капчи
      timeoutRef.current = setTimeout(() => {
        if (captchaWidgetId.current !== null && grecaptcha?.execute) {
          grecaptcha.execute(captchaWidgetId.current).catch((error) => {
            // Игнорируем ошибки, связанные с отменой или сбросом капчи
            console.warn(
              "reCAPTCHA execute warning:",
              error || "Unknown error"
            );
            return null; // Возвращаем null для корректного завершения промиса
          });
        }
      }, 1500); // Увеличенная задержка
    }
    onChange(null);
    onReset?.();
  }, [onChange, onReset]);

  // Экспортируем метод resetCaptcha через ref
  useImperativeHandle(ref, () => ({
    resetCaptcha,
  }));

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reCaptchaWindow = window as ReCaptchaWindow;

    if (!reCaptchaWindow.grecaptcha) {
      reCaptchaWindow.onRecaptchaLoad = () => {
        initializeCaptcha();
      };

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
      reCaptchaWindow.grecaptcha?.render &&
      typeof reCaptchaWindow.grecaptcha.render === "function"
    ) {
      initializeCaptcha();
    } else if (reCaptchaWindow.grecaptcha?.ready) {
      reCaptchaWindow.grecaptcha.ready(() => {
        initializeCaptcha();
      });
    }
  }, []);

  // Функция для инициализации reCAPTCHA
  const initializeCaptcha = () => {
    const reCaptchaWindow = window as ReCaptchaWindow;
    const grecaptcha = reCaptchaWindow?.grecaptcha;

    if (!captchaRef.current || !grecaptcha?.render) {
      console.warn("reCAPTCHA not ready or captcha ref not available");
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error("reCAPTCHA site key not found");
      return;
    }

    try {
      if (captchaWidgetId.current !== null && grecaptcha.reset) {
        grecaptcha.reset(captchaWidgetId.current);
      } else {
        captchaWidgetId.current = grecaptcha.render(captchaRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log("Капча успешно пройдена!");
            onChange(token);
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
            onChange(null);
          },
          "error-callback": () => {
            console.warn("reCAPTCHA error occurred");
            onChange(null);
          },
          size: "invisible",
          badge: "bottomleft",
        });

        setTimeout(() => {
          if (captchaWidgetId.current !== null && grecaptcha?.execute) {
            grecaptcha.execute(captchaWidgetId.current).catch((error) => {
              // Игнорируем ошибки, связанные с отменой или сбросом капчи
              console.warn(
                "reCAPTCHA execute warning:",
                error || "Unknown error"
              );
              return null; // Возвращаем null для корректного завершения промиса
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Ошибка при рендеринге reCAPTCHA:", error);
    }
  };

  return (
    <div>
      <div
        ref={captchaRef}
        className="invisible"
        style={{ width: 0, height: 0 }}
      ></div>

      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
    </div>
  );
});

CaptchaField.displayName = "CaptchaField";
