import { db } from "@/lib/db";
import {
  characteristicsTypes,
  categoryFilterCharacteristics,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redis } from "@/lib/redis";

const CACHE_TTL = 900; // 15 минут

// Интерфейс для представления типа характеристики
export interface CharacteristicType {
  id: number;
  name: string;
  slug: string;
}

// Получить все типы характеристик
export async function getAllCharacteristicTypes(): Promise<
  CharacteristicType[]
> {
  const cacheKey = "all_characteristic_types";
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const types = await db.select().from(characteristicsTypes);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(types));

  return types;
}

// Получить тип характеристики по slug
export async function getCharacteristicTypeBySlug(
  slug: string
): Promise<CharacteristicType | null> {
  const cacheKey = `characteristic_type_${slug}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const types = await db
    .select()
    .from(characteristicsTypes)
    .where(eq(characteristicsTypes.slug, slug))
    .limit(1);

  if (!types.length) {
    return null;
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(types[0]));

  return types[0];
}

// Получить типы характеристик для категории
export async function getCategoryCharacteristicTypes(
  categoryId: number
): Promise<CharacteristicType[]> {
  const cacheKey = `category_${categoryId}_characteristic_types`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const types = await db
    .select({
      id: characteristicsTypes.id,
      name: characteristicsTypes.name,
      slug: characteristicsTypes.slug,
    })
    .from(characteristicsTypes)
    .innerJoin(
      categoryFilterCharacteristics,
      eq(
        characteristicsTypes.id,
        categoryFilterCharacteristics.characteristicTypeId
      )
    )
    .where(eq(categoryFilterCharacteristics.categoryId, categoryId))
    .orderBy(categoryFilterCharacteristics.position);

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(types));

  return types;
}

// Получить тип характеристики по имени
export async function getCharacteristicTypeByName(
  name: string
): Promise<CharacteristicType | null> {
  const cacheKey = `characteristic_type_name_${name}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const types = await db
    .select()
    .from(characteristicsTypes)
    .where(eq(characteristicsTypes.name, name))
    .limit(1);

  if (!types.length) {
    return null;
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(types[0]));

  return types[0];
}

// Получить соответствие между slug и name для всех характеристик
export async function getCharacteristicSlugToNameMap(): Promise<
  Map<string, string>
> {
  const types = await getAllCharacteristicTypes();

  return new Map(types.map((type) => [type.slug, type.name]));
}

// Получить соответствие между name и slug для всех характеристик
export async function getCharacteristicNameToSlugMap(): Promise<
  Map<string, string>
> {
  const types = await getAllCharacteristicTypes();

  return new Map(types.map((type) => [type.name, type.slug]));
}
