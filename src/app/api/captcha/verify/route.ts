import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Токен не предоставлен" },
        { status: 400 }
      );
    }

    // Отправка запроса на сервер reCAPTCHA для проверки
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      }
    );

    const data = await response.json();

    console.log("Результат проверки капчи:", data);

    if (data.success) {
      // Для reCAPTCHA v3 можно добавить проверку score
      if (data.score !== undefined) {
        console.log(`Капча пройдена со скором: ${data.score}`);
        // Решение: проходит ли капча на основе score
        if (data.score < 0.5) {
          return NextResponse.json(
            { success: false, error: "Низкий скор капчи", score: data.score },
            { status: 400 }
          );
        }
      } else {
        console.log("Капча пройдена (Invisible reCAPTCHA)");
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Ошибка проверки капчи" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Ошибка сервера при проверке капчи:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
