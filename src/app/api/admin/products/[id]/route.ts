import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { products, productCharacteristics, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { 
  createSlug, 
  updateProductImage, 
  deleteProductImage 
} from "@/lib/utils/fileUtils";

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (request.method === "PUT") {
    try {
      const productId = parseInt(params.id);
      if (isNaN(productId)) {
        return NextResponse.json(
          { error: "Invalid product ID" },
          { status: 400 }
        );
      }

      // Проверяем, существует ли товар
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      const formData = await request.formData();

      const title = formData.get("title") as string;
      const price = parseFloat(formData.get("price") as string);
      const brand = formData.get("brand") as string;
      const description = formData.get("description") as string;
      const categoryId = parseInt(formData.get("categoryId") as string);
      const characteristicsJson = formData.get("characteristics") as string;
      const imageFile = formData.get("image") as File | null;

      // Валидация обязательных полей
      if (!title || isNaN(price) || isNaN(categoryId)) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }      // Создаем slug из названия для использования в имени файла
      const slug = createSlug(title);

      // Проверяем уникальность slug, если название изменилось
      if (slug !== existingProduct.slug) {
        const slugExists = await db.query.products.findFirst({
          where: eq(products.slug, slug),
        });

        if (slugExists) {
          return NextResponse.json(
            { error: "Товар с таким названием уже существует" },
            { status: 400 }
          );        }
      }

      // Получаем данные категории для определения slug
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });

      if (!category) {
        return NextResponse.json(
          { error: "Категория не найдена" },
          { status: 400 }
        );
      }

      let imagePath = existingProduct.image; // Используем существующее изображение по умолчанию

      // Обработка нового изображения
      if (imageFile && imageFile.size > 0) {
        try {
          imagePath = await updateProductImage(
            imageFile, 
            slug, 
            category.slug, 
            existingProduct.image
          );
        } catch (error) {
          console.error("Error updating image:", error);
          return NextResponse.json(
            { error: "Ошибка при обновлении изображения" },
            { status: 500 }
          );
        }      }

      // Обновляем основные данные товара
      const [updatedProduct] = await db
        .update(products)
        .set({
          slug, // Обновляем slug при изменении названия
          title,
          price: price.toString(),
          brand: brand || "",
          description: description || "",
          categoryId,
          image: imagePath,
        })
        .where(eq(products.id, productId))
        .returning();

      // Обрабатываем характеристики
      if (characteristicsJson) {
        try {
          const characteristics = JSON.parse(characteristicsJson);
          // Удаляем старые характеристики товара
          await db
            .delete(productCharacteristics)
            .where(eq(productCharacteristics.product_id, productId));

          // Добавляем новые характеристики
          if (Object.keys(characteristics).length > 0) {
            const characteristicEntries = Object.entries(characteristics)
              .filter(([_, value]) => value && value.toString().trim() !== "")
              .map(([characteristicId, value]) => ({
                product_id: productId,
                characteristic_type_id: parseInt(characteristicId),
                value: (value as string).toString(),
              }));

            if (characteristicEntries.length > 0) {
              await db
                .insert(productCharacteristics)
                .values(characteristicEntries);
            }
          }
        } catch (error) {
          console.error("Error processing characteristics:", error);
        }
      } // Получаем обновленный товар с характеристиками
      const productWithDetails = await db.query.products.findFirst({
        where: eq(products.id, productId),
        with: {
          category: true,
          characteristics: {
            with: {
              characteristicType: true,
            },
          },
        },
      });      return NextResponse.json({
        message: "Product updated successfully",
        product: productWithDetails,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }
  } else if (request.method === "DELETE") {
    try {
      const productId = parseInt(params.id);
      if (isNaN(productId)) {
        return NextResponse.json(
          { error: "Invalid product ID" },
          { status: 400 }
        );
      }

      // Проверяем, существует ли товар
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }      // Удаляем характеристики товара
      await db
        .delete(productCharacteristics)
        .where(eq(productCharacteristics.product_id, productId));

      // Удаляем изображение товара, если оно есть
      if (existingProduct.image) {
        await deleteProductImage(existingProduct.image);
      }

      // Удаляем сам товар
      await db.delete(products).where(eq(products.id, productId));

      return NextResponse.json({
        message: "Product deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const PUT = withAuth(handler, ["admin"]);
export const DELETE = withAuth(handler, ["admin"]);
