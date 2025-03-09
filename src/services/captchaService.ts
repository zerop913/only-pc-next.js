export async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/captcha/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Капча успешно верифицирована на сервере!");
    } else {
      console.error("Ошибка верификации капчи:", data.error);
    }

    return data.success;
  } catch (error) {
    console.error("Ошибка при проверке каптчи:", error);
    return false;
  }
}
