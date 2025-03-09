import { NextRequest, NextResponse } from "next/server";
import { deleteUser } from "@/services/authService";
import { withAuth } from "@/lib/auth/middleware";

async function handler(
  request: NextRequest,
  context: {
    params: { id?: string };
    currentUserId: number;
  }
) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID пользователя не указан" },
        { status: 400 }
      );
    }

    const userIdToDelete = parseInt(id);

    if (isNaN(userIdToDelete)) {
      return NextResponse.json(
        { error: "Некорректный ID пользователя" },
        { status: 400 }
      );
    }

    const deletedUser = await deleteUser(userIdToDelete, context.currentUserId);

    return NextResponse.json(
      {
        message: "Пользователь успешно удален",
        user: deletedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handler, ["admin"]);
