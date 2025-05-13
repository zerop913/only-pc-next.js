import { db } from "@/lib/db";
import { users, roles, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redis } from "@/lib/redis";
import jwt from "jsonwebtoken";
import { sendVerificationCode } from "@/services/emailService";

// Время жизни кеша в секундах (1 час)
const CACHE_TTL = 3600;

// Схемы валидации
export const RegisterSchema = z
  .object({
    email: z
      .string({
        required_error: "Email является обязательным полем",
        invalid_type_error: "Email должен быть строкой",
      })
      .email("Некорректный формат email"),
    password: z
      .string({
        required_error: "Пароль является обязательным полем",
        invalid_type_error: "Пароль должен быть строкой",
      })
      .min(6, "Пароль должен содержать не менее 6 символов"),
    confirmPassword: z.string({
      required_error: "Подтверждение пароля является обязательным полем",
      invalid_type_error: "Подтверждение пароля должно быть строкой",
    }),
    captchaToken: z.string({
      required_error: "Подтвердите, что вы не робот",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
  captchaToken: z.string({
    required_error: "Подтвердите, что вы не робот",
  }),
});

// Схема для верификации кода
export const VerifyLoginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

export const ProfileSchema = z.object({
  firstName: z.string().min(2, "Имя должно содержать не менее 2 символов"),
  lastName: z.string().min(2, "Фамилия должна содержать не менее 2 символов"),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Некорректный номер телефона"),
  city: z.string().min(2, "Город должен содержать не менее 2 символов"),
});

export const PasswordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Текущий пароль обязателен"),
    newPassword: z
      .string()
      .min(6, "Новый пароль должен содержать не менее 6 символов"),
    confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

// Определение типа пользователя для токена
type TokenUser = {
  id: number;
  email: string;
  roleId: number;
  isActive: boolean;
};

// Функция для создания токена авторизации
export function generateAuthToken(user: TokenUser) {
  const tokenExpiration = 7 * 24 * 60 * 60; // 7 дней в секундах
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      exp: Math.floor(Date.now() / 1000) + tokenExpiration,
    },
    process.env.JWT_SECRET || "default_secret"
  );
}

// Функция для проверки текущего пользователя
export async function getCurrentUser(token: string) {
  try {
    // Расшифровываем токен
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as {
      userId: number;
      email: string;
      roleId: number;
      exp: number;
    };

    // Проверяем срок действия токена
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }

    // Пытаемся получить пользователя из кеша
    const cachedUser = await redis.get(`user:${decoded.userId}`);

    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Если в кеше нет, запрашиваем из БД
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Проверяем, что roleId не null (защитное программирование)
    if (user.roleId === null) {
      throw new Error("У пользователя отсутствует роль");
    }

    // Кешируем пользователя с более длительным TTL
    const userToCache = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive ?? true, // Используем значение по умолчанию если null
    };

    // Увеличиваем время жизни кеша до 24 часов
    await redis.set(
      `user:${user.id}`,
      JSON.stringify(userToCache),
      "EX",
      24 * 60 * 60 // 24 часа
    );

    return userToCache;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// Регистрация пользователя
export async function registerUser(data: z.infer<typeof RegisterSchema>) {
  const validatedData = RegisterSchema.parse(data);

  // Проверяем существование пользователя
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, validatedData.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Пользователь с таким email уже существует");
  }

  // Хэширование пароля
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  // Получаем роль клиента
  const clientRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, "client"))
    .limit(1);

  if (clientRole.length === 0) {
    throw new Error("Роль клиента не найдена");
  }

  // Создаем пользователя
  const [newUser] = await db
    .insert(users)
    .values({
      email: validatedData.email,
      password: hashedPassword,
      roleId: clientRole[0].id,
      isActive: true,
    })
    .returning();

  return { user: newUser };
}

// Аутентификация пользователя
export async function loginUser(data: z.infer<typeof VerifyLoginSchema>) {
  const validatedData = VerifyLoginSchema.parse(data);
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  const user = await db.query.users.findFirst({
    where: eq(users.email, validatedData.email),
    with: {
      profile: true,
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  const isValidPassword = await bcrypt.compare(
    validatedData.password,
    user.password
  );

  if (!isValidPassword) {
    throw new Error("Неверный пароль");
  }

  // Обновляем lastLoginAt сразу в базе
  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, user.id));

  // Кешируем пользователя
  const userToCache = {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    isActive: user.isActive,
  };

  await redis.set(
    `user:${user.id}`,
    JSON.stringify(userToCache),
    "EX",
    CACHE_TTL
  );

  // Создаем объект безопасного пользователя для токена
  const safeUser: TokenUser = {
    id: user.id,
    email: user.email,
    roleId: user.roleId || 2,
    isActive: user.isActive ?? true,
  };

  // Генерируем токен авторизации
  const token = generateAuthToken(safeUser);

  return { user: safeUser, token };
}

// Выход пользователя
export async function logoutUser(userId: number) {
  // Удаляем пользователя из кеша
  await redis.del(`user:${userId}`);
  return true;
}

// Обновление профиля пользователя
export async function updateUserProfile(
  userId: number,
  data: z.infer<typeof ProfileSchema>
) {
  const validatedData = ProfileSchema.parse(data);

  // Проверяем существование пользователя
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser) {
    throw new Error("Пользователь не найден");
  }

  // Обновляем или создаем профиль
  const [profile] = await db
    .insert(userProfiles)
    .values({
      userId,
      ...validatedData,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: validatedData,
    })
    .returning();

  // Инвалидируем кеш пользователя
  await redis.del(`user:${userId}`);

  return profile;
}

// Получение профиля пользователя
export async function getUserProfile(userId: number) {
  // Сначала получаем данные профиля
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  // Затем получаем данные пользователя для получения createdAt
  const [user] = await db
    .select({
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Объединяем данные
  return {
    ...(profile || {}),
    createdAt: user?.createdAt || null,
  };
}

// Удаление профиля
export async function deleteUser(userId: number, currentUserId: number) {
  // Проверяем, что пользователь существует
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  // Проверяем права на удаление (только admin или сам пользователь)
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!currentUser || currentUser.roleId === null) {
    throw new Error("Текущий пользователь не найден или не имеет роли");
  }

  const [adminRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, "admin"))
    .limit(1);

  if (currentUser.roleId !== adminRole.id && currentUser.id !== userId) {
    throw new Error("Недостаточно прав для удаления пользователя");
  }

  // Удаляем профиль пользователя (каскадное удаление)
  await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

  // Удаляем пользователя
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning();

  // Удаляем пользователя из кеша
  await redis.del(`user:${userId}`);

  return deletedUser;
}

// Обновление пароля
export async function updateUserPassword(
  userId: number,
  data: z.infer<typeof PasswordUpdateSchema>
) {
  // Валидация данных
  const validatedData = PasswordUpdateSchema.parse(data);

  // Получаем пользователя из БД
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "Пользователь не найден" };
  }

  // Проверяем текущий пароль
  const isCurrentPasswordValid = await bcrypt.compare(
    validatedData.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    return { success: false, error: "Текущий пароль неверен" };
  }

  // Проверяем, что новый пароль отличается от старого
  if (validatedData.currentPassword === validatedData.newPassword) {
    return {
      success: false,
      error: "Новый пароль должен отличаться от текущего",
    };
  }

  // Хешируем новый пароль
  const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

  // Обновляем пароль в БД
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  // Инвалидируем кеш пользователя для перелогина
  await redis.del(`user:${userId}`);

  return { success: true };
}
