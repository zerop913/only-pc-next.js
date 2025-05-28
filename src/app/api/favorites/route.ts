import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  removeFromFavoritesByProductId,
  mergeFavorites,
} from "@/services/favoriteService";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    let userId: number | undefined;

    if (token) {
      const decoded = verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      ) as {
        userId: number;
      };
      userId = decoded.userId;
    }

    const favorites = await getFavorites(userId);
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Favorites fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    const token = request.cookies.get("token")?.value;
    let userId: number | undefined;

    if (token) {
      const decoded = verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      ) as {
        userId: number;
      };
      userId = decoded.userId;
    }

    const result = await addToFavorites(productId, userId);
    // Проверяем, что результат является массивом
    if (Array.isArray(result) && result.length > 0) {
      return NextResponse.json({ success: true, favorite: result[0] });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to favorites error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { favoriteId, productId } = await request.json();
    const token = request.cookies.get("token")?.value;
    let userId: number | undefined;

    if (token) {
      const decoded = verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      ) as {
        userId: number;
      };
      userId = decoded.userId;
    }

    // Поддерживаем оба способа удаления: по favoriteId или по productId
    if (favoriteId !== undefined) {
      await removeFromFavorites(favoriteId, userId);
    } else if (productId !== undefined) {
      await removeFromFavoritesByProductId(productId, userId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
