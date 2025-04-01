import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { isNull, inArray } from "drizzle-orm";
import { BuildValidation } from "@/types/pcbuild";

export async function calculateBuildPrice(
  components: Record<string, string>
): Promise<number> {
  try {
    // Получаем все slug'и продуктов
    const productSlugs = Object.values(components);

    // Получаем цены всех продуктов по slug
    const productPrices = await db
      .select({ slug: products.slug, price: products.price })
      .from(products)
      .where(inArray(products.slug, productSlugs));

    // Считаем общую стоимость
    const totalPrice = productPrices.reduce(
      (sum, product) => sum + Number(product.price),
      0
    );

    return totalPrice;
  } catch (error) {
    console.error("Error calculating build price:", error);
    throw new Error("Ошибка при расчете стоимости сборки");
  }
}

// Функция для получения обязательных категорий
export async function getRequiredCategories(): Promise<
  Array<{ slug: string; name: string }>
> {
  const requiredCategories = await db
    .select({
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories)
    .where(isNull(categories.parentId));

  return requiredCategories;
}

// Функция для проверки полноты сборки
export async function validateBuild(
  components: Record<string, string>
): Promise<BuildValidation> {
  const requiredCategories = await getRequiredCategories();
  const presentCategorySlugs = new Set(Object.keys(components));

  const missingCategories = requiredCategories.filter(
    (category) => !presentCategorySlugs.has(category.slug)
  );

  return {
    isValid: missingCategories.length === 0,
    missingCategories,
  };
}
