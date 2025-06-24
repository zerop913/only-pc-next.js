// Проверка кода подтверждения
export const verifyCode = async (
  email: string,
  code: string,
  origin?: string
): Promise<boolean> => {
  try {
    // Импортируем функцию для получения правильного API URL
    let apiUrl;

    if (typeof window === "undefined") {
      // На сервере используем абсолютный URL из API_BASE_URL
      const { getApiUrl } = await import("@/utils/apiUtils");
      apiUrl = getApiUrl("/api/email");
      console.log(
        `[emailService] Server-side verification, using URL: ${apiUrl}`
      );
    } else {
      // В браузере используем относительный путь
      apiUrl = "/api/email";
      console.log(
        `[emailService] Client-side verification, using URL: ${apiUrl}`
      );
    }

    console.log(
      "emailService.verifyCode - Verifying code using API URL:",
      apiUrl,
      {
        email,
        code,
        isServer: typeof window === "undefined",
        origin,
      }
    );

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();

    console.log("emailService.verifyCode - Response:", {
      status: response.status,
      ok: response.ok,
      result,
      url: apiUrl,
    });

    if (!response.ok) {
      console.error("emailService.verifyCode - Verification failed:", {
        status: response.status,
        error: result,
        url: apiUrl,
      });
      return false;
    }

    return result.success === true;
  } catch (error) {
    console.error("emailService.verifyCode - Error verifying code:", error);
    return false;
  }
};

// Отправка кода подтверждения через Resend
export const sendVerificationCode = async (
  email: string,
  origin?: string
): Promise<string> => {
  try {
    // Импортируем функцию для получения правильного API URL
    let apiUrl;

    if (typeof window === "undefined") {
      // На сервере используем абсолютный URL из API_BASE_URL
      const { getApiUrl } = await import("@/utils/apiUtils");
      apiUrl = getApiUrl("/api/email");
    } else {
      // В браузере используем относительный путь
      apiUrl = "/api/email";
    }

    console.log("Sending verification code using API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка отправки кода подтверждения");
    }

    const result = await response.json();
    return result.code || "";
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw error;
  }
};
