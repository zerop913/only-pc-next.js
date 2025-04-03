import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { redis } from "@/lib/redis";

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

    // Создаем транспорт для отправки почты
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.ru",
      port: 465,
      secure: true,
      auth: {
        user: "onlypc.contact@mail.ru",
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Генерируем и сохраняем код
    const code = generateVerificationCode();
    await redis.set(`email_verification:${email}`, code, "EX", 600);

    // Отправляем письмо
    await transporter.sendMail({
      from: "onlypc.contact@mail.ru",
      to: email,
      subject: "Код подтверждения входа в OnlyPC",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body style="margin: 0; padding: 20px; background-color: #1a1b23; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
              <tr>
                <td>
                  <div style="text-align: center; padding: 20px 0;">
                    <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">OnlyPC</h1>
                    <p style="color: #ffffff; margin-top: 10px;">Подтверждение входа</p>
                  </div>
                  
                  <div style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 30px; margin: 20px 0;">
                    <div style="text-align: center;">
                      <p style="color: #ffffff; margin-bottom: 20px;">Ваш код подтверждения:</p>
                      <div style="background-color: rgba(26, 27, 35, 0.8); border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <span style="color: #3b82f6; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
                      </div>
                      <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px;">Код действителен в течение 10 минут</p>
                    </div>
                  </div>
                  
                  <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(59, 130, 246, 0.2);">
                    <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin-bottom: 10px;">
                      Если вы не запрашивали этот код, просто проигнорируйте это письмо.
                    </p>
                    <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">
                      © ${new Date().getFullYear()} OnlyPC. Все права защищены.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка отправки кода:", error);
    return NextResponse.json(
      { error: `Ошибка отправки кода: ${error.message}` },
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
