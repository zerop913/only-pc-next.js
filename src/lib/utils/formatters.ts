/**
 * Форматирует цену в рублях
 */
export function formatPrice(price: string | number): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

/**
 * Форматирует дату в локализованный формат по московскому времени
 */
export function formatDate(date: string | Date): string {
  const dateObject = typeof date === "string" ? new Date(date) : date;
  return dateObject.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
