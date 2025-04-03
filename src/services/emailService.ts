// Проверка кода подтверждения
export const verifyCode = async (
  email: string,
  code: string,
  origin?: string
): Promise<boolean> => {
  try {
    // Определяем baseUrl в зависимости от окружения
    const baseUrl =
      origin ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5000");

    const response = await fetch(`${baseUrl}/api/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Error verifying code:", error);
    return false;
  }
};

// Отправка кода подтверждения
export const sendVerificationCode = async (
  email: string,
  origin?: string
): Promise<string> => {
  try {
    // Определяем baseUrl в зависимости от окружения
    const baseUrl =
      origin ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5000");

    const response = await fetch(`${baseUrl}/api/email`, {
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
