import { db } from "@/lib/db";
import { favorites, products, categories } from "@/lib/db/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { FavoriteProduct, FavoriteItem, FavoritesMap } from "@/types/favorite";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";

export async function addToFavorites(productId: number, userId?: number) {
  // Проверяем, существует ли уже такая запись
  const existing = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.productId, productId),
        userId ? eq(favorites.userId, userId) : isNull(favorites.userId)
      )
    )
    .limit(1);

  // Если запись существует, удаляем её
  if (existing.length > 0) {
    const favoriteId = existing[0].id;
    return await removeFromFavorites(favoriteId, userId);
  }

  // Если записи нет, добавляем новую
  return await db
    .insert(favorites)
    .values({
      productId,
      userId: userId || null,
    })
    .returning();
}

export async function removeFromFavorites(favoriteId: number, userId?: number) {
  return await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.id, favoriteId),
        userId ? eq(favorites.userId, userId) : isNull(favorites.userId)
      )
    );
}

export async function removeFromFavoritesByProductId(
  productId: number,
  userId?: number
) {
  return await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.productId, productId),
        userId ? eq(favorites.userId, userId) : isNull(favorites.userId)
      )
    );
}

export async function getFavorites(userId?: number): Promise<FavoritesMap> {
  try {
    // Определяем тип для результата запроса
    type DatabaseResult = {
      id: number;
      productId: number;
      createdAt: Date;
      product_id: number;
      product_title: string;
      product_slug: string;
      product_price: string | number;
      product_image: string | null;
      product_categoryId: number;
      product_brand: string | null;
      category_name: string;
      category_slug: string;
    };

    const items = await db.transaction(
      async (tx: NodePgDatabase<typeof schema>) => {
        const result = await tx
          .select({
            id: favorites.id,
            productId: favorites.productId,
            createdAt: favorites.createdAt,
            product_id: products.id,
            product_title: products.title,
            product_slug: products.slug,
            product_price: products.price,
            product_image: products.image,
            product_categoryId: products.categoryId,
            product_brand: products.brand,
            category_name: categories.name,
            category_slug: categories.slug,
          })
          .from(favorites)
          .leftJoin(products, eq(favorites.productId, products.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(
            userId ? eq(favorites.userId, userId) : isNull(favorites.userId)
          );

        return result as DatabaseResult[];
      }
    );

    const result = items.reduce<FavoritesMap>((acc, item) => {
      const categoryId = Number(item.product_categoryId);

      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      const favoriteItem: FavoriteItem = {
        id: Number(item.id),
        productId: Number(item.productId),
        product: {
          id: Number(item.product_id),
          title: String(item.product_title),
          slug: String(item.product_slug),
          price: Number(item.product_price),
          brand: String(item.product_brand || ""),
          image: item.product_image,
          categoryId: Number(item.product_categoryId),
          characteristics: [],
          description: null, // Добавляем отсутствующее поле description
          createdAt: new Date().toISOString(), // Добавляем отсутствующее поле createdAt
          category: {
            name: String(item.category_name),
            slug: String(item.category_slug),
          },
        },
        createdAt: new Date(item.createdAt),
      };

      acc[categoryId].push(favoriteItem);
      return acc;
    }, {});

    return result;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return {};
  }
}

export async function isFavorite(productId: number, userId?: number) {
  const found = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.productId, productId),
        userId ? eq(favorites.userId, userId) : isNull(favorites.userId)
      )
    )
    .limit(1);

  return found.length > 0;
}

export async function mergeFavorites(userId: number, temporaryIds: number[]) {
  // Начинаем транзакцию
  return await db.transaction(async (tx) => {
    try {
      if (temporaryIds.length === 0) return true;

      // Обновляем записи с null userId на текущего пользователя
      await tx
        .update(favorites)
        .set({ userId })
        .where(
          and(
            isNull(favorites.userId),
            inArray(favorites.productId, temporaryIds)
          )
        );

      // Получаем существующие избранные товары пользователя
      const existingFavorites = await tx
        .select()
        .from(favorites)
        .where(eq(favorites.userId, userId));

      // Фильтруем временные ID, исключая уже существующие
      const existingProductIds = new Set(
        existingFavorites.map((fav) => fav.productId)
      );
      const newIds = temporaryIds.filter((id) => !existingProductIds.has(id));

      // Добавляем новые избранные товары только если их нет у пользователя
      if (newIds.length > 0) {
        await tx.insert(favorites).values(
          newIds.map((productId) => ({
            userId,
            productId,
          }))
        );
      }

      return true;
    } catch (error) {
      console.error("Error in mergeFavorites:", error);
      throw error;
    }
  });
}

/**
 * Удаляет все избранные товары пользователя
 * @param userId ID пользователя или undefined для анонимных записей
 */
export async function clearFavorites(userId?: number) {
  return await db
    .delete(favorites)
    .where(userId ? eq(favorites.userId, userId) : isNull(favorites.userId));
}
