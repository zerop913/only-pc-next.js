/**
 * Утилиты для работы с изображениями и Cloudinary
 */

// Cloudinary настройки
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "donvdhjbe";
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Преобразует локальный путь к изображению в Cloudinary URL
 * @param localPath - локальный путь типа '/images/kategoria/file.jpg'
 * @returns Cloudinary URL
 */
export function getCloudinaryImageUrl(localPath: string): string {
  // Убираем ведущий слеш если есть
  const normalizedPath = localPath.startsWith("/")
    ? localPath.slice(1)
    : localPath;

  // Заменяем 'images/' на 'onlypc-images/'
  const cloudinaryPath = normalizedPath.replace(/^images\//, "onlypc-images/");

  // Убираем расширение файла для Cloudinary
  const pathWithoutExtension = cloudinaryPath.replace(/\.[^/.]+$/, "");

  // Формируем полный Cloudinary URL с автоматической оптимизацией
  return `${CLOUDINARY_BASE_URL}/f_auto,q_auto/${pathWithoutExtension}`;
}

/**
 * Преобразует путь из базы данных в правильный URL для отображения
 * В продакшене использует Cloudinary, в разработке - локальные файлы
 * @param imagePath - путь к изображению из БД
 * @returns URL для использования в src атрибуте
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return "/images/placeholder.jpg"; // Заглушка по умолчанию
  } // В продакшене используем Cloudinary, в development - локальные файлы
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.includes("only-pc.ru");

  return isProduction ? getCloudinaryImageUrl(imagePath) : imagePath;
}

/**
 * Получает оптимизированный URL для изображения с указанными параметрами
 * @param imagePath - путь к изображению
 * @param width - ширина
 * @param height - высота
 * @param quality - качество (по умолчанию auto)
 * @returns оптимизированный URL
 */
export function getOptimizedImageUrl(
  imagePath: string,
  width?: number,
  height?: number,
  quality: string | number = "auto"
): string {
  if (!imagePath) {
    return "/images/placeholder.jpg";
  } // В продакшене используем Cloudinary с параметрами оптимизации
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.includes("only-pc.ru");

  if (isProduction) {
    const normalizedPath = imagePath.startsWith("/")
      ? imagePath.slice(1)
      : imagePath;
    const cloudinaryPath = normalizedPath.replace(
      /^images\//,
      "onlypc-images/"
    );
    const pathWithoutExtension = cloudinaryPath.replace(/\.[^/.]+$/, "");

    let transformations = ["f_auto", `q_${quality}`];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);

    return `${CLOUDINARY_BASE_URL}/${transformations.join(",")}/${pathWithoutExtension}`;
  }

  // В разработке возвращаем локальный путь
  return imagePath;
}

/**
 * Получает thumbnail URL для изображения
 * @param imagePath - путь к изображению
 * @param size - размер thumbnail (по умолчанию 200px)
 * @returns URL для thumbnail
 */
export function getThumbnailUrl(imagePath: string, size: number = 200): string {
  return getOptimizedImageUrl(imagePath, size, size, 80);
}

/**
 * Создает srcSet для responsive изображений
 * @param imagePath - путь к изображению
 * @param sizes - массив размеров
 * @returns строка srcSet
 */
export function createSrcSet(
  imagePath: string,
  sizes: number[] = [400, 800, 1200]
): string {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.includes("only-pc.ru");

  if (!imagePath || !isProduction) {
    return "";
  }

  return sizes
    .map((size) => `${getOptimizedImageUrl(imagePath, size)} ${size}w`)
    .join(", ");
}
