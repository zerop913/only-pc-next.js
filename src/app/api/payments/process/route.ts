import { NextRequest, NextResponse } from "next/server";
import { processPayment } from "@/services/paymentService";
import { withAuth } from "@/lib/auth/middleware";

// Используем withAuth как обертку для обработчика запроса
export const POST = withAuth(async (req: NextRequest, context: { currentUserId: number }) => {
  try {
    // Получаем данные из запроса
    const { amount, paymentMethodId, paymentType, cardData } = await req.json();

    // Проверяем обязательные поля
    if (!amount || !paymentMethodId || !paymentType) {
      return NextResponse.json(
        { success: false, error: "Не указаны обязательные параметры платежа" },
        { status: 400 }
      );
    }

    // Проверяем данные карты для платежа картой
    if (paymentType === 'card' && (!cardData || !cardData.cardNumber || !cardData.cardholderName || !cardData.expiryDate || !cardData.cvv)) {
      return NextResponse.json(
        { success: false, error: "Не указаны данные банковской карты" },
        { status: 400 }
      );
    }

    // Обрабатываем платеж через сервис
    const paymentResult = await processPayment({
      amount,
      paymentMethodId,
      paymentType,
      cardData
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: paymentResult.message || "Ошибка при обработке платежа" 
        },
        { status: 500 }
      );
    }

    // Возвращаем результат платежа
    return NextResponse.json({
      success: true,
      paymentId: paymentResult.paymentId,
      qrCodeUrl: paymentResult.qrCodeUrl // только для QR-кода
    });

  } catch (error) {
    console.error("Ошибка при обработке платежа:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Неизвестная ошибка" 
      },
      { status: 500 }
    );
  }
});
