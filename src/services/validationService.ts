import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";
import { BuildValidation } from "@/types/pcbuild";

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
