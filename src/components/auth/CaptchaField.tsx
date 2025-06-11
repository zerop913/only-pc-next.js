import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";

interface CaptchaFieldProps {
  onChange: (token: string | null) => void;
  onReset?: () => void;
}

interface ReCaptchaWindow extends Window {
  onRecaptchaLoad?: () => void;
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

export const CaptchaField = forwardRef<
  { resetCaptcha: () => void },
  CaptchaFieldProps
>(({ onChange, onReset }, ref) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для выполнения reCAPTCHA
  const executeRecaptcha = useCallback(async () => {
    if (typeof window === "undefined") return;

    const reCaptchaWindow = window as ReCaptchaWindow;

    try {
      if (!reCaptchaWindow.grecaptcha) {
        console.warn("reCAPTCHA еще не загружена");
        return;
      }

      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        console.error("reCAPTCHA site key не найден");
        return;
      }

      await reCaptchaWindow.grecaptcha.ready(async () => {
        try {
          const token = await reCaptchaWindow.grecaptcha!.execute(siteKey, {
            action: "login",
          });
          console.log("Капча успешно пройдена!");
          onChange(token);
        } catch (error) {
          console.warn("Ошибка при выполнении reCAPTCHA:", error);
          onChange(null);
        }
      });
    } catch (error) {
      console.error("Ошибка при инициализации reCAPTCHA:", error);
      onChange(null);
    }
  }, [onChange]);

  // Метод для сброса и повторного запуска reCAPTCHA
  const resetCaptcha = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Устанавливаем задержку перед повторной проверкой
    timeoutRef.current = setTimeout(() => {
      executeRecaptcha();
    }, 1500);

    onChange(null);
    onReset?.();
  }, [executeRecaptcha, onChange, onReset]);

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

  // Загрузка скрипта reCAPTCHA v3
  useEffect(() => {
    if (typeof window === "undefined" || isScriptLoaded) return;

    const loadRecaptchaScript = () => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
        executeRecaptcha();
      };

      document.head.appendChild(script);
      scriptRef.current = script;
    };

    loadRecaptchaScript();

    // Очистка при размонтировании компонента
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, [executeRecaptcha]);

  // Добавляем глобальные стили для скрытия значка капчи при монтировании компонента
  useEffect(() => {
    // Проверяем, существует ли уже стиль для скрытия капчи
    let styleElement = document.getElementById("recaptcha-badge-hide");

    if (!styleElement) {
      // Создаем новый элемент стиля
      styleElement = document.createElement("style");
      styleElement.id = "recaptcha-badge-hide";
      styleElement.innerHTML = `
        .grecaptcha-badge { 
          visibility: hidden !important; 
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          z-index: -999999 !important;
          display: none !important;
          pointer-events: none !important;
          bottom: -9999px !important;
          right: -9999px !important;
        }
      `;

      // Добавляем стиль в head документа
      document.head.appendChild(styleElement);
    }

    // Функция очистки при размонтировании компонента
    return () => {
      // Не удаляем стиль при размонтировании, чтобы он продолжал действовать
    };
  }, []);

  return <div style={{ display: "none" }} />;
});

CaptchaField.displayName = "CaptchaField";
