import { NextRequest, NextResponse } from "next/server";
import { checkQrPaymentStatus } from "@/services/paymentService";
import { withAuth } from "@/lib/auth/middleware";

// Используем withAuth как обертку для обработчика запроса
export const POST = withAuth(
  async (req: NextRequest, context: { currentUserId: number }) => {
    try {
      // Получаем данные из запроса
      const { paymentId } = await req.json();

      // Проверяем формат ID платежа (должен быть в формате PAY-timestamp)
      if (!paymentId || !paymentId.startsWith("PAY-")) {
        return NextResponse.json(
          { success: false, error: "Некорректный формат ID платежа" },
          { status: 400 }
        );
      }

      // Проверяем статус платежа
      const paymentStatus = await checkQrPaymentStatus(paymentId);

      if (!paymentStatus.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              paymentStatus.message || "Ошибка при проверке статуса платежа",
          },
          { status: 500 }
        );
      }

      // Возвращаем статус платежа
      return NextResponse.json({
        success: true,
        status: paymentStatus.paid ? "paid" : "pending",
      });
    } catch (error) {
      console.error("Ошибка при проверке статуса платежа:", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        },
        { status: 500 }
      );
    }
  }
);
