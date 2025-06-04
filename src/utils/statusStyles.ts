/**
 * Утилита для генерации CSS классов статусов заказов на основе цвета
 */

/**
 * Конвертирует HEX цвет в RGB компоненты
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Убираем # если есть
  const cleanHex = hex.replace('#', '');
  
  // Проверяем формат
  if (cleanHex.length !== 6) {
    return null;
  }

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  return { r, g, b };
}

/**
 * Генерирует CSS классы для статуса на основе цвета
 */
export function generateStatusClasses(color?: string): string {
  if (!color) {
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }

  const rgb = hexToRgb(color);
  if (!rgb) {
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }

  // Создаем стили с использованием RGB значений
  const bgColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const textColor = color;
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

  return `border border-[${borderColor}] text-[${textColor}] bg-[${bgColor}]`;
}

/**
 * Генерирует инлайн стили для статуса
 */
export function generateStatusStyles(color?: string): React.CSSProperties {
  if (!color) {
    return {
      backgroundColor: "rgba(107, 114, 128, 0.1)", // gray-500/10
      color: "#9CA3AF", // gray-400
      borderColor: "rgba(107, 114, 128, 0.2)", // gray-500/20
    };
  }

  const rgb = hexToRgb(color);
  if (!rgb) {
    return {
      backgroundColor: "rgba(107, 114, 128, 0.1)",
      color: "#9CA3AF",
      borderColor: "rgba(107, 114, 128, 0.2)",
    };
  }

  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    color: color,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
  };
}
