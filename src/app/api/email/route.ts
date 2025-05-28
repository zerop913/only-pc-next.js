import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { redis } from "@/lib/redis";
import { renderVerificationEmail } from "@/lib/utils/emailRenderer";

// Инициализация Resend API
const resend = new Resend(process.env.RESEND_API_KEY);

// Функция для генерации кода верификации
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Обработчик запросов на отправку кода подтверждения
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email не указан" }, { status: 400 });
    }

    // Генерируем и сохраняем код
    const code = generateVerificationCode();
    // Код действителен 5 минут
    await redis.set(`email_verification:${email}`, code, "EX", 300);

    // Используем новую функцию для рендеринга письма
    const htmlContent = await renderVerificationEmail(code);

    // Отправляем письмо с использованием Resend
    const { data, error } = await resend.emails.send({
      from: "OnlyPC <noreply@only-pc.ru>",
      replyTo: process.env.MAIL_REPLY_TO || "contact@only-pc.ru",
      to: email,
      subject: "Код подтверждения входа в OnlyPC",
      html: htmlContent,
    });

    if (error) {
      console.error("Ошибка отправки кода через Resend:", error);
      throw new Error(`Ошибка отправки кода: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка отправки кода:", error);
    return NextResponse.json(
      {
        error: `Ошибка отправки кода: ${error.message || "Неизвестная ошибка"}`,
      },
      { status: 500 }
    );
  }
}

// Обработчик для проверки кода
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Не указан email или код подтверждения" },
        { status: 400 }
      );
    }

    const storedCode = await redis.get(`email_verification:${email}`);
    console.log("Stored code vs Provided code:", { storedCode, code });

    if (!storedCode) {
      return NextResponse.json(
        { error: "Код подтверждения истек или не существует" },
        { status: 400 }
      );
    }

    // Проверка кода
    const isValid = String(storedCode) === String(code);

    if (isValid) {
      await redis.del(`email_verification:${email}`);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Неверный код подтверждения" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Ошибка проверки кода:", error);
    return NextResponse.json(
      { error: `Ошибка проверки кода: ${error.message}` },
      { status: 500 }
    );
  }
}
