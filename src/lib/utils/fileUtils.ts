import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import slugify from "slugify";

export function createSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    locale: "ru",
    trim: true,
  });
}

// Функция для получения расширения файла
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

// Функция для сохранения изображения товара
export async function saveProductImage(
  imageFile: File,
  productSlug: string,
  categorySlug: string
): Promise<string> {
  try {
    const extension = getFileExtension(imageFile.name);
    const fileName = `${productSlug}${extension}`;

    // Используем slug категории для определения папки
    const categoryFolder = categorySlug;

    // Путь к папке для сохранения
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "images",
      categoryFolder
    );

    // Создаем папку, если она не существует
    await mkdir(uploadDir, { recursive: true });

    // Полный путь к файлу
    const filePath = path.join(uploadDir, fileName);

    // Конвертируем File в Buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Сохраняем файл
    await writeFile(filePath, buffer);

    // Возвращаем относительный путь для базы данных
    return `/images/${categoryFolder}/${fileName}`;
  } catch (error) {
    console.error("Error saving product image:", error);
    throw new Error("Failed to save product image");
  }
}

// Функция для обновления изображения товара
export async function updateProductImage(
  imageFile: File,
  productSlug: string,
  categorySlug: string,
  oldImagePath?: string | null
): Promise<string> {
  try {
    // Удаляем старое изображение, если оно существует
    if (oldImagePath) {
      await deleteProductImage(oldImagePath);
    }

    // Сохраняем новое изображение
    return await saveProductImage(imageFile, productSlug, categorySlug);
  } catch (error) {
    console.error("Error updating product image:", error);
    throw new Error("Failed to update product image");
  }
}

// Функция для удаления изображения товара
export async function deleteProductImage(imagePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), "public", imagePath);

    if (existsSync(fullPath)) {
      await unlink(fullPath);
      console.log(`Deleted image: ${fullPath}`);
    }
  } catch (error) {
    console.error("Error deleting product image:", error);
    // Не выбрасываем ошибку, так как это не критично
  }
}

// Функция для получения пути к изображению товара
export function getProductImagePath(
  productSlug: string,
  categorySlug: string,
  extension: string = ".jpg"
): string {
  return `/images/${categorySlug}/${productSlug}${extension}`;
}
