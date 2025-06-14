import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { products, productCharacteristics, categories } from "@/lib/db/schema";
import { sql, ilike, or, and, eq } from "drizzle-orm";
import {
  createSlug,
  saveProductImage,
  deleteProductImage,
} from "@/lib/utils/fileUtils";

const ITEMS_PER_PAGE = 12;

async function handler(request: NextRequest) {
  if (request.method === "GET") {
    try {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, Number(searchParams.get("page")) || 1);
      const search = searchParams.get("search") || "";
      const categoryId = searchParams.get("category");
      const offset = (page - 1) * ITEMS_PER_PAGE;

      const conditions = [];

      // Поисковый фильтр
      if (search) {
        conditions.push(
          or(
            ilike(products.title, `%${search}%`),
            ilike(products.brand, `%${search}%`),
            ilike(products.description || "", `%${search}%`)
          )
        );
      }

      // Фильтр по категории (только если категория указана)
      if (categoryId && categoryId !== "null" && !isNaN(Number(categoryId))) {
        conditions.push(eq(products.categoryId, Number(categoryId)));
      }

      const finalCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Получаем общее количество с учетом фильтров
      const [totalCountResult] = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(products)
        .where(finalCondition || sql`TRUE`);

      // Получаем товары с учетом фильтров
      const allProducts = await db.query.products.findMany({
        limit: ITEMS_PER_PAGE,
        offset,
        where: finalCondition,
        orderBy: (products, { desc }) => [desc(products.id)],
        with: {
          category: true,
          characteristics: {
            with: {
              characteristicType: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(totalCountResult.count / ITEMS_PER_PAGE);

      return NextResponse.json({
        products: allProducts,
        currentPage: page,
        totalPages,
        totalItems: totalCountResult.count,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
  } else if (request.method === "POST") {
    try {
      const formData = await request.formData();

      const categoryId = parseInt(formData.get("categoryId") as string);
      const title = formData.get("title") as string;
      const price = parseFloat(formData.get("price") as string);
      const brand = formData.get("brand") as string;
      const description = formData.get("description") as string;
      const characteristicsJson = formData.get("characteristics") as string;
      const imageFile = formData.get("image") as File | null;

      // Валидация обязательных полей
      if (!categoryId || !title || !price || !brand) {
        return NextResponse.json(
          { error: "Все обязательные поля должны быть заполнены" },
          { status: 400 }
        );
      }

      // Создаем slug из названия
      const slug = createSlug(title);

      // Проверяем уникальность slug
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.slug, slug),
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "Товар с таким названием уже существует" },
          { status: 400 }
        );
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

      let imagePath = null;

      // Обработка загрузки изображения
      if (imageFile) {
        try {
          imagePath = await saveProductImage(imageFile, slug, category.slug);
        } catch (error) {
          console.error("Error saving image:", error);
          return NextResponse.json(
            { error: "Ошибка при сохранении изображения" },
            { status: 500 }
          );
        }
      }

      // Создаем товар
      const [newProduct] = await db
        .insert(products)
        .values({
          categoryId,
          slug,
          title,
          price: price.toString(),
          brand,
          description: description || "",
          image: imagePath,
        })
        .returning();

      // Добавляем характеристики, если они есть
      if (characteristicsJson && characteristicsJson !== "{}") {
        const characteristics = JSON.parse(characteristicsJson);
        const characteristicEntries = Object.entries(characteristics).filter(
          ([_, value]) => value && (value as string).trim() !== ""
        );

        if (characteristicEntries.length > 0) {
          const characteristicData = characteristicEntries.map(
            ([typeId, value]) => ({
              product_id: newProduct.id,
              characteristic_type_id: parseInt(typeId),
              value: (value as string).trim(),
            })
          );

          await db.insert(productCharacteristics).values(characteristicData);
        }
      }

      return NextResponse.json({
        message: "Товар успешно создан",
        product: newProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Ошибка при создании товара" },
        { status: 500 }
      );
    }
  }
}

export const GET = withAuth(handler, ["admin"]);
export const POST = withAuth(handler, ["admin"]);
