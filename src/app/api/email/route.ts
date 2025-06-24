import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { redis } from "@/lib/redis";
import { renderVerificationEmail } from "@/lib/utils/emailRenderer";
import { getInMemoryStorage } from "@/lib/inMemoryStorage";

// Инициализация Resend API
const resend = new Resend(process.env.RESEND_API_KEY);

// Функция для генерации кода верификации
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Функция для безопасного использования хранилища с fallback
async function safeStorageSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  // В development режиме без Redis URL используем in-memory storage
  if (process.env.NODE_ENV === "development" && !process.env.REDIS_URL) {
    console.log(
      `[Storage] Development mode, using in-memory storage for ${key}`
    );
    const inMemory = getInMemoryStorage();
    await inMemory.set(
      key.replace("email_verification:", ""),
      value,
      ttlSeconds
    );
    return;
  }

  try {
    console.log(`[Storage] Attempting Redis ping for ${key}`);
    const pingResult = await redis.ping();
    console.log(`[Storage] Redis ping result: ${pingResult}`);
    
    console.log(`[Storage] Setting key in Redis: ${key}`);
    const setResult = await redis.setex(key, ttlSeconds, value);
    console.log(`[Storage] Redis setex result: ${setResult}`);
    
    console.log(`[Storage] Successfully used Redis for storing ${key}`);
  } catch (redisError) {
    console.error(
      `[Storage] Redis failed for ${key}:`,
      redisError instanceof Error ? redisError.message : redisError
    );
    console.error(`[Storage] Redis error stack:`, redisError instanceof Error ? redisError.stack : 'No stack');
    console.warn(`[Storage] Falling back to in-memory storage for ${key}`);
    
    const inMemory = getInMemoryStorage();
    await inMemory.set(
      key.replace("email_verification:", ""),
      value,
      ttlSeconds
    );
    console.log(`[Storage] Successfully used in-memory storage for ${key}`);
  }
}

async function safeStorageGet(key: string): Promise<string | null> {
  // В development режиме без Redis URL используем in-memory storage
  if (process.env.NODE_ENV === "development" && !process.env.REDIS_URL) {
    console.log(
      `[Storage] Development mode, using in-memory storage for ${key}`
    );
    const inMemory = getInMemoryStorage();
    return await inMemory.get(key.replace("email_verification:", ""));
  }

  try {
    console.log(`[Storage] Attempting Redis ping for get ${key}`);
    const pingResult = await redis.ping();
    console.log(`[Storage] Redis ping result: ${pingResult}`);
    
    console.log(`[Storage] Getting key from Redis: ${key}`);
    const result = await redis.get(key);
    console.log(`[Storage] Redis get result for ${key}: ${result ? 'found' : 'not found'}`);
    
    console.log(`[Storage] Successfully used Redis for retrieving ${key}`);
    return result;
  } catch (redisError) {
    console.error(
      `[Storage] Redis failed for get ${key}:`,
      redisError instanceof Error ? redisError.message : redisError
    );
    console.warn(`[Storage] Falling back to in-memory storage for ${key}`);
    
    const inMemory = getInMemoryStorage();
    const result = await inMemory.get(key.replace("email_verification:", ""));
    console.log(`[Storage] In-memory get result for ${key}: ${result ? 'found' : 'not found'}`);
    return result;
  }
}

async function safeStorageDelete(key: string): Promise<void> {
  // В development режиме без Redis URL используем in-memory storage
  if (process.env.NODE_ENV === "development" && !process.env.REDIS_URL) {
    console.log(
      `[Storage] Development mode, using in-memory storage for ${key}`
    );
    const inMemory = getInMemoryStorage();
    await inMemory.delete(key.replace("email_verification:", ""));
    return;
  }

  try {
    await redis.ping();
    await redis.del(key);
    console.log(`[Storage] Used Redis for deleting ${key}`);
  } catch (redisError) {
    console.warn(
      `[Storage] Redis failed, using in-memory storage:`,
      redisError
    );
    const inMemory = getInMemoryStorage();
    await inMemory.delete(key.replace("email_verification:", ""));
  }
}

// Обработчик запросов на отправку кода подтверждения
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email не указан" }, { status: 400 });
    }

    // Генерируем код
    const code = generateVerificationCode();
    console.log("Generated verification code:", {
      email,
      code,
      codeType: typeof code,
    });

    // Сохраняем код с fallback (5 минут TTL)
    try {
      console.log(`[Email] Attempting to save verification code for ${email}`);
      await safeStorageSet(`email_verification:${email}`, code, 300);

      // Проверяем, что код сохранился
      console.log(`[Email] Verifying code was saved for ${email}`);
      const savedCode = await safeStorageGet(`email_verification:${email}`);
      console.log("Code saved verification:", {
        email,
        savedCode,
        originalCode: code,
        match: savedCode === code,
      });

      if (!savedCode) {
        throw new Error("Failed to save verification code - code not found after save");
      }
      
      if (savedCode !== code) {
        throw new Error(`Failed to save verification code - mismatch: expected ${code}, got ${savedCode}`);
      }
      
      console.log(`[Email] Verification code successfully saved and verified for ${email}`);
    } catch (storageError) {
      console.error("Storage error:", storageError);
      return NextResponse.json(
        { error: "Не удалось сохранить код верификации. Попробуйте позже." },
        { status: 503 }
      );
    }

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

    console.log("Verification email sent successfully to:", email);
    return NextResponse.json({
      success: true,
      codeForDebug: process.env.NODE_ENV === "development" ? code : undefined,
    });
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

    console.log("PUT /api/email - Code verification request:", {
      email,
      code,
      codeType: typeof code,
      codeLength: code?.length,
    });

    if (!email || !code) {
      return NextResponse.json(
        { error: "Не указан email или код подтверждения" },
        { status: 400 }
      );
    }

    // Получаем сохраненный код с fallback
    const storedCode = await safeStorageGet(`email_verification:${email}`);

    console.log("Email verification debug:", {
      email,
      providedCode: code,
      providedCodeType: typeof code,
      storedCode,
      storedCodeType: typeof storedCode,
      redisKey: `email_verification:${email}`,
    });

    if (!storedCode) {
      console.error("No stored code found for email:", email);
      return NextResponse.json(
        { error: "Код подтверждения истек или не существует" },
        { status: 400 }
      );
    }

    // Нормализуем оба кода к строкам и убираем возможные пробелы
    const normalizedStoredCode = String(storedCode).trim();
    const normalizedProvidedCode = String(code).trim();

    console.log("Normalized codes:", {
      normalizedStoredCode,
      normalizedProvidedCode,
      isEqual: normalizedStoredCode === normalizedProvidedCode,
    });

    // Проверка кода
    const isValid = normalizedStoredCode === normalizedProvidedCode;

    if (isValid) {
      console.log("Code verification successful, deleting from storage");
      await safeStorageDelete(`email_verification:${email}`);
      return NextResponse.json({ success: true });
    } else {
      console.error("Code verification failed", {
        expected: normalizedStoredCode,
        received: normalizedProvidedCode,
      });
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
