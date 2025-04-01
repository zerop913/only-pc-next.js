import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pcBuilds, users, userProfiles, products } from "@/lib/db/schema";
import { createSlug } from "@/utils/buildUtils";
import { eq, inArray, sql } from "drizzle-orm";
import { RawBuildQueryResult, BuildQueryResult } from "@/types/api";
import { jwtVerify } from "jose";

export async function GET(request: NextRequest) {
  try {
    const rawBuilds = await db
      .select({
        id: pcBuilds.id,
        name: pcBuilds.name,
        slug: pcBuilds.slug,
        components: pcBuilds.components,
        totalPrice: pcBuilds.totalPrice,
        createdAt: pcBuilds.createdAt,
        updatedAt: pcBuilds.updatedAt,
        userId: pcBuilds.userId,
        user_id: users.id,
        user_email: users.email,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
      })
      .from(pcBuilds)
      .leftJoin(users, eq(pcBuilds.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

    const formattedBuilds = (rawBuilds as RawBuildQueryResult[]).map(
      (build): BuildQueryResult => ({
        id: build.id,
        name: build.name,
        slug: build.slug,
        components: build.components,
        totalPrice: build.totalPrice,
        createdAt: build.createdAt.toISOString(),
        updatedAt: build.updatedAt.toISOString(),
        userId: build.userId,
        user: build.user_id
          ? {
              id: build.user_id,
              email: build.user_email || "",
              profile: {
                firstName: build.firstName,
                lastName: build.lastName,
              },
            }
          : {
              id: 0,
              email: "",
              profile: {
                firstName: null,
                lastName: null,
              },
            },
      })
    );

    return NextResponse.json({ builds: formattedBuilds });
  } catch (error) {
    console.error("Error fetching builds:", error);
    return NextResponse.json(
      { error: "Failed to fetch builds" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Проверяем, является ли это обновлением существующей сборки
    if (data.isEditing && data.buildSlug) {
      // Ищем существующую сборку
      const [existingBuild] = await db
        .select()
        .from(pcBuilds)
        .where(eq(pcBuilds.slug, data.buildSlug))
        .limit(1);

      if (existingBuild) {
        const totalPrice = await calculateBuildPrice(data.components);

        // Обновляем существующую сборку
        const [updatedBuild] = await db
          .update(pcBuilds)
          .set({
            components: JSON.stringify(data.components),
            totalPrice: totalPrice.toString(),
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(pcBuilds.id, existingBuild.id))
          .returning();

        return NextResponse.json({ build: updatedBuild });
      }
    }

    // Если это новая сборка или не нашли существующую
    if (!data.name || !data.components) {
      console.log("Missing required fields:", { data });
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля" },
        { status: 400 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      console.log("User not found from token");
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 401 }
      );
    }

    console.log("User found:", user);

    const totalPrice = await calculateBuildPrice(data.components);
    const slug = createSlug(data.name);

    console.log("Creating build with:", {
      name: data.name,
      slug,
      components: data.components,
      totalPrice,
      userId: user.id,
    });

    const [build] = await db
      .insert(pcBuilds)
      .values({
        name: data.name,
        slug,
        components: JSON.stringify(data.components),
        totalPrice: totalPrice.toString(),
        userId: user.id,
      })
      .returning();

    console.log("Created build:", build);

    return NextResponse.json({ build });
  } catch (error) {
    console.error("Error creating build:", error);
    return NextResponse.json(
      { error: "Ошибка при создании сборки" },
      { status: 500 }
    );
  }
}

// Добавляем новую функцию calculateBuildPrice
async function calculateBuildPrice(
  components: Record<string, string>
): Promise<number> {
  try {
    // Получаем все slug'и продуктов
    const productSlugs = Object.values(components);

    // Получаем цены всех продуктов по их slug из базы данных
    const productPrices = await db
      .select({
        slug: products.slug,
        price: products.price,
      })
      .from(products)
      .where(inArray(products.slug, productSlugs));

    console.log("Found product prices:", productPrices);

    // Считаем общую стоимость
    const totalPrice = productPrices.reduce((sum, product) => {
      return sum + Number(product.price);
    }, 0);

    console.log("Calculated total price:", totalPrice);

    return totalPrice;
  } catch (error) {
    console.error("Error calculating build price:", error);
    throw new Error("Failed to calculate build price");
  }
}

async function getUserFromToken(token: string) {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as any).userId;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}
