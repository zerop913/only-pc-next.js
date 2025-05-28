import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface DeliveryMethod {
  name: string;
  price: number;
}

interface PaymentParams {
  amount: number;
  paymentMethodId: number;
  paymentType: "card" | "qrcode";
  cardData?: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  };
  orderDetails?: {
    description?: string;
    items?: OrderItem[];
    deliveryMethod?: DeliveryMethod;
  };
}

/**
 * Обрабатывает платеж (карта или QR-код)
 */
export async function processPayment(params: PaymentParams): Promise<{
  success: boolean;
  paymentId?: string;
  qrCodeUrl?: string;
  message?: string;
}> {
  try {
    console.log(
      `Обработка платежа, тип: ${params.paymentType}, сумма: ${params.amount}`
    );

    const paymentId = `PAY-${Date.now()}`;

    if (params.paymentType === "qrcode") {
    // Форматируем дату для отображения в русском формате
      const now = new Date();
      const formattedDate = now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Создаем детальные данные для QR-кода
      const qrData = {
        paymentId: paymentId,
        amount: params.amount,
        date: formattedDate,
        description: params.orderDetails?.description || "Оплата OnlyPC",
        items: params.orderDetails?.items?.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })) || [],
        deliveryMethod: params.orderDetails?.deliveryMethod || null,
        totalPrice: params.amount
      };
      
      try {
        // Генерируем data URL QR-кода
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'M',
          margin: 2,
          scale: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        return {
          success: true,
          paymentId,
          qrCodeUrl: qrCodeUrl
        };
      } catch (qrError) {
        console.error("Ошибка при генерации QR-кода:", qrError);
        throw new Error("Не удалось сгенерировать QR-код");
      }
    } else if (params.paymentType === "card") {
      // Имитация обработки платежа по карте
      console.log("Обработка платежа по карте:", params.cardData);
      return {
        success: true,
        paymentId,
      };
    }

    throw new Error("Неизвестный тип платежа");
  } catch (error) {
    console.error("Ошибка при обработке платежа:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка при обработке платежа",
    };
  }
}

/**
 * Обновляет статус заказа после успешной оплаты
 */
export async function updateOrderAfterPayment(
  orderId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await db
      .update(orders)
      .set({
        statusId: 3, // "Оплачен"
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении статуса заказа после оплаты:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Создает предзаказ с временным статусом
 */
export async function createPendingOrder(orderData: any): Promise<{
  success: boolean;
  order?: any;
  message?: string;
}> {
  try {
    // Здесь можно добавить логику создания предварительного заказа
    return { success: true, order: { id: 1, orderNumber: "123" } }; // Заглушка
  } catch (error) {
    console.error("Ошибка при создании предзаказа:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Проверяет статус платежа по QR-коду (имитация)
 */
export async function checkQrPaymentStatus(
  paymentId: string
): Promise<{ success: boolean; paid: boolean; message?: string }> {
  // Имитация проверки статуса платежа
  return {
    success: true,
    paid: true,
  };
}
