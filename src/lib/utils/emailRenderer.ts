import { renderAsync } from "@react-email/render";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";
import { ReactElement } from "react";

/**
 * Асинхронно рендерит HTML шаблон письма с верификационным кодом
 * @param code - Код верификации для вставки в шаблон
 * @returns Обещание, разрешающееся в строку HTML
 */
export async function renderVerificationEmail(code: string): Promise<string> {
  try {
    // Создаем экземпляр React компонента письма
    const emailComponent = VerificationCodeEmail({ code }) as ReactElement;

    // Рендерим компонент в HTML строку
    const html = await renderAsync(emailComponent);

    return html;
  } catch (error) {
    console.error("Ошибка рендеринга шаблона письма с кодом:", error);
    throw error;
  }
}
