import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { users, userProfiles, favorites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string }; currentUserId: number }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const userId = parseInt(id);
    const updates = await request.json();

    // Разделяем данные для users и userProfiles
    const { firstName, lastName, phoneNumber, city, ...userData } = updates;
    const profileData = { firstName, lastName, phoneNumber, city };

    // Получаем текущие данные пользователя для сравнения
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { profile: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверяем, есть ли реальные изменения в основных данных пользователя
    const hasUserChanges = Object.entries(userData).some(
      ([key, value]) => currentUser[key as keyof typeof currentUser] !== value
    );

    // Проверяем, есть ли изменения в профиле
    const hasProfileChanges = Object.entries(profileData).some(
      ([key, value]) =>
        currentUser.profile?.[key as keyof typeof currentUser.profile] !== value
    );

    // Начинаем транзакцию
    const result = await db.transaction(async (tx) => {
      // Обновляем основные данные пользователя
      const updatedUser = await tx
        .update(users)
        .set({
          ...userData,
          ...(hasUserChanges || hasProfileChanges
            ? { updatedAt: new Date() }
            : {}),
        })
        .where(eq(users.id, userId))
        .returning();

      // Обновляем или создаем профиль при наличии изменений
      if (hasProfileChanges) {
        if (currentUser.profile) {
          await tx
            .update(userProfiles)
            .set(profileData)
            .where(eq(userProfiles.userId, userId));
        } else {
          await tx.insert(userProfiles).values({
            userId,
            ...profileData,
          });
        }
      }

      return updatedUser[0];
    });

    if (!result) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Получаем обновленные данные пользователя вместе с профилем
    const updatedUserWithProfile = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { profile: true },
    });

    // Готовим данные для ответа
    const { password, ...safeUser } = updatedUserWithProfile!;
    const responseData = {
      ...safeUser,
      firstName: safeUser.profile?.firstName || null,
      lastName: safeUser.profile?.lastName || null,
      phoneNumber: safeUser.profile?.phoneNumber || null,
      city: safeUser.profile?.city || null,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении пользователя" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string }; currentUserId: number }
) {
  try {
    const { id } = context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Используем транзакцию для каскадного удаления
    return await db.transaction(async (tx) => {
      // Сначала удаляем связанные данные
      await tx.delete(favorites).where(eq(favorites.userId, userId));
      await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));

      // Затем удаляем самого пользователя
      const deletedUsers = await tx
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deletedUsers.length) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
