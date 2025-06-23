import { db } from "@/lib/db";
import { products, pcBuilds } from "@/lib/db/schema";
import { or, ilike } from "drizzle-orm";
import { redis } from "@/lib/redis";

const CACHE_TTL = 180; // 3 минуты

export async function generateSuggestions(
  query: string,
  includePcBuilds: boolean = false
): Promise<string[]> {
  try {
    const cacheKey = `suggestions:${query}:${includePcBuilds}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await db
      .select({
        title: products.title,
        brand: products.brand,
      })
      .from(products)
      .where(
        or(
          ilike(products.title, `%${query}%`),
          ilike(products.brand, `%${query}%`)
        )
      )
      .limit(10);
    // Добавляем поиск по готовым сборкам, если нужно
    let buildResults: { name: string }[] = [];
    if (includePcBuilds) {
      buildResults = await db
        .select({
          name: pcBuilds.name,
        })
        .from(pcBuilds)
        .where(ilike(pcBuilds.name, `%${query}%`))
        .limit(5);
    }

    const suggestions = new Set<string>();

    // Обрабатываем продукты
    results.forEach(({ title, brand }) => {
      // Добавляем релевантные части названия
      const words = title.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase().includes(query.toLowerCase())) {
          // Добавляем отдельное слово
          suggestions.add(words[i]);

          // Добавляем короткую фразу (до 3 слов)
          let phrase = words[i];

          for (let j = 1; j < 3 && i + j < words.length; j++) {
            phrase += ` ${words[i + j]}`;
            suggestions.add(phrase);
          }
        }
      } // Добавляем бренд, если он содержит запрос
      if (brand.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(brand);
      }
    });

    // Обрабатываем готовые сборки
    if (includePcBuilds && buildResults.length > 0) {
      buildResults.forEach(({ name }) => {
        if (name.toLowerCase().includes(query.toLowerCase())) {
          // Добавляем полное название сборки
          suggestions.add(name);

          // Добавляем подсказки с различными префиксами
          suggestions.add(`Сборка ${name}`);
          suggestions.add(`Готовая сборка ${name}`);

          // Добавляем подсказку для поиска всех сборок
          if (
            query.toLowerCase().includes("сбор") ||
            query.toLowerCase().includes("готов")
          ) {
            suggestions.add("Готовые сборки компьютеров");
          }
        }
      });
    }
    const finalSuggestions = Array.from(suggestions)
      .filter((s: string) => s.length >= query.length)
      .sort((a: string, b: string) => {
        // Приоритет точным совпадениям в начале
        const aStarts = a.toLowerCase().startsWith(query.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(query.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length;
      })
      .slice(0, 5);

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(finalSuggestions));
    return finalSuggestions;
  } catch (error) {
    console.error("Suggestions generation error:", error);
    return [];
  }
}
