import { NextRequest, NextResponse } from "next/server";
import { updateUserProfile, getUserProfile } from "@/services/authService";
import { verify } from "jsonwebtoken";

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Отсутствует токен авторизации" },
        { status: 401 }
      );
    }

    const decoded = verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as { userId: number };

    const body = await request.json();
    const profile = await updateUserProfile(decoded.userId, body);

    // Возвращаем обновленный профиль в едином формате
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Отсутствует токен авторизации" },
        { status: 401 }
      );
    }

    const decoded = verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as { userId: number };

    const profile = await getUserProfile(decoded.userId);

    // Возвращаем профиль в едином формате
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("Profile fetch error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
