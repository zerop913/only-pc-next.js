import { NextRequest, NextResponse } from "next/server";
import { processPayment } from "@/services/paymentService";
import { withAuth } from "@/lib/auth/middleware";

// Используем withAuth как обертку для обработчика запроса
export const POST = withAuth(
  async (req: NextRequest, context: { currentUserId: number }) => {
    try {
      // Получаем данные из запроса
      const { amount, description, paymentMethodId, items, deliveryMethod } =
        await req.json();

      // Проверяем обязательные поля
      if (!amount || !paymentMethodId) {
        return NextResponse.json(
          { success: false, error: "Не указана сумма или метод оплаты" },
          { status: 400 }
        );
      }

      // Обрабатываем запрос на генерацию QR-кода
      const paymentResult = await processPayment({
        amount,
        paymentMethodId,
        paymentType: "qrcode",
        orderDetails: {
          description,
          items,
          deliveryMethod,
        },
      });

      if (!paymentResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: paymentResult.message || "Ошибка при генерации QR-кода",
          },
          { status: 500 }
        );
      } // Возвращаем QR-код и данные платежа
      return NextResponse.json({
        success: true,
        qrCodeUrl: paymentResult.qrCodeUrl,
        paymentId: paymentResult.paymentId,
      });
    } catch (error) {
      console.error("Ошибка при создании QR-кода:", error);
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
