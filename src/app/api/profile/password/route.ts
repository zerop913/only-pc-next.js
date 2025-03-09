import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { updateUserPassword } from "@/services/authService";

export const PUT = withAuth(
  async (
    request: NextRequest,
    { currentUserId }: { currentUserId: number }
  ) => {
    try {
      const body = await request.json();

      const result = await updateUserPassword(currentUserId, body);

      if (result.success) {
        return NextResponse.json(
          { message: "Пароль успешно обновлен" },
          { status: 200 }
        );
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } catch (error) {
      console.error("Password update error:", error);

      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        { error: "Внутренняя ошибка сервера" },
        { status: 500 }
      );
    }
  }
);
