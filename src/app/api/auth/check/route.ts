import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/authService";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const user = await getCurrentUser(token);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Возвращаем только необходимые данные пользователя для UI
    const safeUser = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    return NextResponse.json(
      { authenticated: true, user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
