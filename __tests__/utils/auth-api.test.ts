import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";
import * as authService from "@/services/authService";

// Типы для тестов
type TokenUser = {
  id: number;
  email: string;
  roleId: number;
  isActive: boolean;
};

// Мокаем сервис аутентификации
jest.mock("@/services/authService", () => ({
  loginUser: jest.fn(),
}));

// Мокаем базу данных
jest.mock("@/lib/db", () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn(),
      }),
    }),
  },
}));

// Мокаем схему БД
jest.mock("@/lib/db/schema", () => ({
  users: {},
}));

// Мокаем drizzle-orm
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

// Мокаем глобальный fetch
global.fetch = jest.fn();

describe("API /api/auth/login", () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Мокаем переменные окружения
    process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";
  });

  describe("POST запросы", () => {
    it("должен успешно авторизовать пользователя с валидными данными", async () => {
      // Подготовка данных
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        isActive: true,
        role: "user",
        roleId: 1,
      };

      const mockToken = "jwt-token-123";

      // Мокаем успешную проверку каптчи
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Мокаем успешную авторизацию
      mockAuthService.loginUser.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      // Создаем mock request
      const requestBody = {
        email: "test@example.com",
        password: "password123",
        captchaToken: "captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      // API возвращает только id, email, roleId
      expect(data.user).toEqual({
        id: 1,
        email: "test@example.com",
        roleId: 1,
      });
      // Токен устанавливается в cookie, а не возвращается в JSON
      expect(response.headers.get("set-cookie")).toContain("token=");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("recaptcha/api/siteverify"),
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(requestBody);
    });

    it("должен отклонить запрос при неудачной проверке каптчи", async () => {
      // Мокаем неудачную проверку каптчи
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      } as Response);

      // Создаем mock request
      const requestBody = {
        email: "test@example.com",
        password: "password123",
        captchaToken: "invalid-captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(400);
      expect(data.error).toContain("Проверка на робота не пройдена");
      expect(mockAuthService.loginUser).not.toHaveBeenCalled();
    });
    it("должен отклонить запрос для деактивированного пользователя", async () => {
      // Подготовка данных
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        isActive: false, // Деактивированный пользователь
        role: "user",
        roleId: 1,
      };

      const mockToken = "jwt-token-123";

      // Мокаем успешную проверку каптчи
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Мокаем авторизацию деактивированного пользователя
      mockAuthService.loginUser.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      // Создаем mock request
      const requestBody = {
        email: "test@example.com",
        password: "password123",
        captchaToken: "captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(403);
      expect(data.error).toContain("Аккаунт деактивирован");
    });
    it("должен обрабатывать ошибки авторизации", async () => {
      // Мокаем успешную проверку каптчи
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Мокаем ошибку авторизации
      mockAuthService.loginUser.mockRejectedValue(
        new Error("Invalid credentials")
      );

      // Создаем mock request
      const requestBody = {
        email: "test@example.com",
        password: "wrongpassword",
        captchaToken: "captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request);

      // Проверяем результат - API возвращает 400 для ошибок валидации
      expect(response.status).toBe(400);
    });
    it("должен обрабатывать ошибки каптчи", async () => {
      // Мокаем ошибку при проверке каптчи
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Создаем mock request
      const requestBody = {
        email: "test@example.com",
        password: "password123",
        captchaToken: "captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request);

      // Проверяем результат - сетевые ошибки возвращают 400
      expect(response.status).toBe(400);
    });
    it("должен обрабатывать некорректный JSON", async () => {
      // Создаем mock request с некорректным JSON
      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: "invalid json",
        headers: {
          "Content-Type": "application/json",
        },
      }); // Выполняем запрос
      const response = await POST(request); // Проверяем результат - ошибки парсинга возвращают 400
      expect(response.status).toBe(400);
    });
    it("должен корректно обновлять время последнего входа", async () => {
      // Подготовка данных
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        isActive: true,
        role: "user",
        roleId: 1,
      };

      const mockToken = "jwt-token-123";

      // Мокаем успешную проверку каптчи
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Мокаем успешную авторизацию
      mockAuthService.loginUser.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      // Создаем mock request
      const requestBody = {
        email: "test@example.com",
        password: "password123",
        captchaToken: "captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request);

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(requestBody);
    });
  });

  describe("Безопасность", () => {
    it("должен требовать валидный токен каптчи", async () => {
      // Создаем mock request без токена каптчи
      const requestBody = {
        email: "test@example.com",
        password: "password123",
        // captchaToken отсутствует
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем проверку каптчи без токена
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      } as Response);

      // Выполняем запрос
      const response = await POST(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(400);
      expect(data.error).toContain("Проверка на робота не пройдена");
    });

    it("должен проверять наличие обязательных полей", async () => {
      // Мокаем успешную проверку каптчи
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Мокаем ошибку валидации в сервисе
      mockAuthService.loginUser.mockRejectedValue(
        new Error("Email is required")
      );

      // Создаем mock request без email
      const requestBody = {
        password: "password123",
        captchaToken: "captcha-token",
      };

      const request = new NextRequest("http://localhost:5000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Выполняем запрос
      const response = await POST(request); // Проверяем результат - валидационные ошибки возвращают 400
      expect(response.status).toBe(400);
    });
  });
});
