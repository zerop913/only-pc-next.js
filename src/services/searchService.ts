import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { type Product } from "@/types/product";

interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: "relevance" | "price_asc" | "price_desc";
}

interface SearchResponse {
  items: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
}

const CACHE_TTL = 300; // 5 минут для кеша поиска

const calculateRelevance = (product: any, searchTerms: string[]) => {
  let score = 0;
  const title = product.title.toLowerCase();
  const description = (product.description || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();

  // Точное совпадение с названием
  if (searchTerms.some((term) => title === term)) {
    score += 100;
  }

  // Начинается с поискового запроса
  if (searchTerms.some((term) => title.startsWith(term))) {
    score += 50;
  }

  // Слово находится в начале названия
  if (searchTerms.some((term) => title.split(" ")[0].includes(term))) {
    score += 30;
  }

  // Подсчет совпадений в названии
  searchTerms.forEach((term) => {
    const titleMatches = (title.match(new RegExp(term, "g")) || []).length;
    score += titleMatches * 15;

    // Совпадение в бренде
    if (brand.includes(term)) {
      score += 10;
    }

    // Совпадение в описании
    const descriptionMatches = (description.match(new RegExp(term, "g")) || [])
      .length;
    score += descriptionMatches * 2;
  });

  // Бонус за короткое название (предполагаем, что это более точное совпадение)
  if (title.length < 30) {
    score += 5;
  }

  // Штраф за слишком длинное название
  if (title.length > 100) {
    score -= 5;
  }

  // Бонус, если все слова из поиска присутствуют в названии
  const allTermsInTitle = searchTerms.every((term) => title.includes(term));
  if (allTermsInTitle) {
    score += 25;
  }

  return score;
};

export async function searchProducts({
  query,
  page = 1,
  limit = 20,
  sort = "relevance",
}: SearchParams): Promise<SearchResponse> {
  try {
    const cacheKey = `search:${query}:${page}:${limit}:${sort}`;
    const cachedResults = await redis.get(cacheKey);

    if (cachedResults) {
      return JSON.parse(cachedResults);
    }

    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const offset = (page - 1) * limit;

    // Создаем условия поиска для каждого термина
    const searchConditions = searchTerms.map((term) =>
      or(
        ilike(products.title, `%${term}%`),
        ilike(products.description || "", `%${term}%`),
        ilike(products.brand, `%${term}%`)
      )
    );

    // Получаем все продукты, соответствующие условиям поиска
    const allProducts = await db
      .select()
      .from(products)
      .where(and(...searchConditions));

    // Сортировка результатов
    let sortedProducts = [...allProducts];

    switch (sort) {
      case "price_asc":
        sortedProducts.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        sortedProducts.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "relevance":
      default:
        sortedProducts.sort((a, b) => {
          const relevanceA = calculateRelevance(a, searchTerms);
          const relevanceB = calculateRelevance(b, searchTerms);

          // При равной релевантности сортируем по длине названия (более короткие впереди)
          if (relevanceB === relevanceA) {
            return a.title.length - b.title.length;
          }

          return relevanceB - relevanceA;
        });
        break;
    }

    // Применяем пагинацию
    const paginatedProducts = sortedProducts.slice(offset, offset + limit);

    const response: SearchResponse = {      items: paginatedProducts.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        price: Number(item.price),
        brand: item.brand,
        image: item.image,
        description: item.description,
        categoryId: item.categoryId,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : item.createdAt?.toISOString() || new Date().toISOString(), // Добавляем createdAt
        characteristics: [],
      })),
      totalItems: allProducts.length,
      totalPages: Math.ceil(allProducts.length / limit),
      currentPage: page,
      query: query,
    };

    // Кешируем результаты
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return response;
  } catch (error) {
    console.error("Search service error:", error);
    throw error;
  }
}

export async function generateSuggestions(query: string): Promise<string[]> {
  try {
    // Получаем все товары, содержащие запрос
    const searchConditions = [
      ilike(products.title, `%${query}%`),
      ilike(products.description || "", `%${query}%`),
      ilike(products.brand, `%${query}%`),
    ];

    const searchResults = await db
      .select({
        title: products.title,
        brand: products.brand,
        description: products.description,
      })
      .from(products)
      .where(or(...searchConditions))
      .limit(20);

    // Извлекаем ключевые фразы из результатов
    const suggestions = new Set<string>();

    searchResults.forEach((result) => {
      // Анализируем название
      const words = result.title.toLowerCase().split(/\s+/);
      let i = 0;
      while (i < words.length) {
        let phrase = words[i];
        if (phrase.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(phrase);
          // Пробуем составить фразу из нескольких слов
          let j = i + 1;
          while (j < words.length && j < i + 4) {
            phrase += " " + words[j];
            suggestions.add(phrase);
            j++;
          }
        }
        i++;
      }

      // Добавляем бренд, если он содержит запрос
      if (result.brand.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(result.brand);
      }
    });

    return Array.from(suggestions)
      .filter((s) => s.length >= query.length)
      .sort((a, b) => {
        // Приоритизируем точные совпадения в начале
        const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.length - b.length;
      })
      .slice(0, 5);
  } catch (error) {
    console.error("Generate suggestions error:", error);
    return [];
  }
}
