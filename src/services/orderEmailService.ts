/**
 * Сервис для отправки электронных писем о заказах
 */

/**
 * Отправляет письмо с подтверждением заказа
 * @param orderId ID оформленного заказа
 */
export const sendOrderConfirmationEmail = async (
  orderId: number
): Promise<boolean> => {
  try {
    const { fetchApi } = await import("@/utils/apiUtils");
    const response = await fetchApi("/api/email/order-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Ошибка при отправке письма:", errorData.error);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Ошибка при отправке письма:", error);
    return false;
  }
};

/**
 * Возвращает URL для предпросмотра письма с подтверждением заказа
 * @param orderId ID заказа (необязательно)
 */
export const getOrderEmailPreviewUrl = (orderId?: number): string => {
  return orderId
    ? `/api/email/preview/order-confirmation?orderId=${orderId}`
    : "/api/email/preview/order-confirmation";
};
