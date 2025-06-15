import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pcBuilds, users, userProfiles } from "@/lib/db/schema";
import { desc, eq, count, and, gte, lte, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");

    const offset = (page - 1) * limit;

    // Построение условий фильтрации
    const conditions = [];

    if (search) {
      conditions.push(like(pcBuilds.name, `%${search}%`));
    }

    if (dateFrom) {
      conditions.push(gte(pcBuilds.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(pcBuilds.createdAt, new Date(dateTo)));
    }

    if (priceMin) {
      conditions.push(gte(pcBuilds.totalPrice, priceMin));
    }

    if (priceMax) {
      conditions.push(lte(pcBuilds.totalPrice, priceMax));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined; // Получение сборок с пагинацией
    const buildsQuery = db
      .select({
        id: pcBuilds.id,
        name: pcBuilds.name,
        slug: pcBuilds.slug,
        totalPrice: pcBuilds.totalPrice,
        createdAt: pcBuilds.createdAt,
        updatedAt: pcBuilds.updatedAt,
        components: pcBuilds.components,
        userId: users.id,
        userEmail: users.email,
        userFirstName: userProfiles.firstName,
        userLastName: userProfiles.lastName,
      })
      .from(pcBuilds)
      .leftJoin(users, eq(pcBuilds.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Применение сортировки
    if (sortBy === "createdAt") {
      buildsQuery.orderBy(
        sortOrder === "desc" ? desc(pcBuilds.createdAt) : pcBuilds.createdAt
      );
    } else if (sortBy === "totalPrice") {
      buildsQuery.orderBy(
        sortOrder === "desc" ? desc(pcBuilds.totalPrice) : pcBuilds.totalPrice
      );
    } else if (sortBy === "name") {
      buildsQuery.orderBy(
        sortOrder === "desc" ? desc(pcBuilds.name) : pcBuilds.name
      );
    }

    const builds = await buildsQuery;

    // Получение общего количества сборок
    const totalCountResult = await db
      .select({ count: count() })
      .from(pcBuilds)
      .where(whereClause);

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / limit); // Обработка компонентов сборок
    const processedBuilds = builds.map((build) => {
      let components = {};
      try {
        // Проверяем, является ли components уже объектом
        if (typeof build.components === "string") {
          components = JSON.parse(build.components);
        } else if (
          typeof build.components === "object" &&
          build.components !== null
        ) {
          components = build.components;
        }
      } catch (error) {
        console.error("Error parsing components for build", build.id, error);
      }

      return {
        ...build,
        components,
        totalPrice: parseFloat(build.totalPrice as string),
        customerName:
          build.userFirstName && build.userLastName
            ? `${build.userFirstName} ${build.userLastName}`
            : build.userEmail || "Неизвестный пользователь",
      };
    });

    return NextResponse.json({
      builds: processedBuilds,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching builds:", error);
    return NextResponse.json(
      { error: "Failed to fetch builds" },
      { status: 500 }
    );
  }
}
