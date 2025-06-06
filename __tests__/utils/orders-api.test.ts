import { NextRequest } from "next/server";
import * as orderService from "@/services/orderService";
import { OrderWithRelations, CreateOrderResponse } from "@/types/order";

// Мокаем middleware аутентификации перед импортом route handler
jest.mock("@/lib/auth/middleware", () => ({
  withAuth: (handler: Function) => (request: any, context: any) => {
    // Если нет currentUserId в контексте, возвращаем ошибку авторизации
    if (!context.currentUserId) {
      return {
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      };
    }
    return handler(request, context);
  },
}));

// Мокаем сервис заказов перед импортом route handler
jest.mock("@/services/orderService", () => ({
  createOrder: jest.fn(),
}));

// Мокаем Next.js внутренние компоненты
jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  return {
    ...originalModule,
    NextRequest: jest.fn().mockImplementation((url, init) => {
      return {
        url,
        method: init?.method || "GET",
        headers: new Map(Object.entries(init?.headers || {})),
        json: async () => JSON.parse(init?.body || "{}"),
        ...init,
      };
    }),
  };
});

// Получаем мокированный сервис
const mockOrderService = orderService as jest.Mocked<typeof orderService>;

describe("API /api/orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Импортируем handler динамически, чтобы моки работали
  const getHandler = async () => {
    const { withAuth } = await import("@/lib/auth/middleware");
    const routeModule = await import("@/app/api/orders/route");
    return routeModule;
  };

  describe("POST запросы (создание заказа)", () => {
    it("должен успешно создать заказ с валидными данными", async () => {
      // Подготовка данных
      const mockOrderData = {
        deliveryMethodId: 1,
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [
          {
            id: 1,
            name: "Игровая сборка",
            price: 50000,
            quantity: 1,
          },
        ],
        totalAmount: 50000,
        paidAt: null,
        paymentStatus: "pending",
      };

      const mockOrderResult: CreateOrderResponse = {
        success: true,
        order: {
          id: 123,
          orderNumber: "ORD-2024-001",
          userId: 1,
          statusId: 1,
          totalPrice: "50000",
          deliveryMethodId: 1,
          paymentMethodId: 1,
          deliveryAddressId: 1,
          deliveryPrice: "0",
          comment: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      // Создаем mock request
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(mockOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем контекст аутентификации
      const context = { currentUserId: 1 };

      // Динамически импортируем и вызываем handler
      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      // Выполняем запрос
      const response = await handler(request, context);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.order.id).toBe(123);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(1, {
        ...mockOrderData,
        statusId: 1, // Новый заказ (неоплаченный)
      });
    });

    it("должен создать оплаченный заказ со статусом 'Оплачен'", async () => {
      // Подготовка данных для оплаченного заказа
      const mockOrderData = {
        deliveryMethodId: 1,
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [
          {
            id: 1,
            name: "Игровая сборка",
            price: 50000,
            quantity: 1,
          },
        ],
        totalAmount: 50000,
        paidAt: new Date().toISOString(),
        paymentStatus: "paid",
      };

      const mockOrderResult: CreateOrderResponse = {
        success: true,
        order: {
          id: 124,
          orderNumber: "ORD-2024-002",
          userId: 1,
          statusId: 3, // Оплаченный статус
          totalPrice: "50000",
          deliveryMethodId: 1,
          paymentMethodId: 1,
          deliveryAddressId: 1,
          deliveryPrice: "0",
          comment: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      // Создаем mock request
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(mockOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем контекст аутентификации
      const context = { currentUserId: 1 };

      // Динамически импортируем и вызываем handler
      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      // Выполняем запрос
      const response = await handler(request, context);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.order.statusId).toBe(3); // Оплаченный статус
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(1, {
        ...mockOrderData,
        statusId: 3, // Оплаченный заказ
      });
    });

    it("должен отклонить заказ с невалидными данными", async () => {
      // Подготовка данных с отсутствующими полями
      const invalidOrderData = {
        // deliveryMethodId отсутствует
        paymentMethodId: 1,
        cartItems: [],
      };

      // Мокаем ошибку валидации
      const mockErrorResult: CreateOrderResponse = {
        success: false,
        message: "Недостаточно данных для создания заказа",
        order: {} as OrderWithRelations, // Пустой объект для соответствия интерфейсу
      };

      mockOrderService.createOrder.mockResolvedValue(mockErrorResult);

      // Создаем mock request
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(invalidOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем контекст аутентификации
      const context = { currentUserId: 1 };

      // Динамически импортируем и вызываем handler
      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      // Выполняем запрос
      const response = await handler(request, context);
      const data = await response.json(); // Проверяем результат
      expect(response.status).toBe(400);
      expect(data.error).toContain("Недостаточно данных");
    });

    it("должен обрабатывать ошибки создания заказа", async () => {
      // Подготовка данных
      const mockOrderData = {
        deliveryMethodId: 1,
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [
          {
            id: 1,
            name: "Игровая сборка",
            price: 50000,
            quantity: 1,
          },
        ],
      };

      // Мокаем ошибку в сервисе
      mockOrderService.createOrder.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Создаем mock request
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(mockOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем контекст аутентификации
      const context = { currentUserId: 1 };

      // Динамически импортируем и вызываем handler
      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      // Выполняем запрос
      const response = await handler(request, context);

      // Проверяем результат
      expect(response.status).toBe(500);
    });

    it("должен корректно обрабатывать пустую корзину", async () => {
      // Подготовка данных с пустой корзиной
      const mockOrderData = {
        deliveryMethodId: 1,
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [], // Пустая корзина
      };

      const mockErrorResult: CreateOrderResponse = {
        success: false,
        message: "Корзина пуста",
        order: {} as OrderWithRelations,
      };

      mockOrderService.createOrder.mockResolvedValue(mockErrorResult);

      // Создаем mock request
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(mockOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем контекст аутентификации
      const context = { currentUserId: 1 };

      // Динамически импортируем и вызываем handler
      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      // Выполняем запрос
      const response = await handler(request, context);
      const data = await response.json();

      // Проверяем результат      expect(response.status).toBe(400);
      expect(data.error).toContain("Корзина пуста");
    });

    it("должен обрабатывать заказ с несколькими товарами", async () => {
      // Подготовка данных с несколькими товарами
      const mockOrderData = {
        deliveryMethodId: 1,
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [
          {
            id: 1,
            name: "Процессор Intel i7",
            price: 25000,
            quantity: 1,
          },
          {
            id: 2,
            name: "Видеокарта RTX 4070",
            price: 45000,
            quantity: 1,
          },
        ],
        totalAmount: 70000,
      };

      const mockOrderResult: CreateOrderResponse = {
        success: true,
        order: {
          id: 125,
          orderNumber: "ORD-2024-003",
          userId: 1,
          statusId: 1,
          totalPrice: "70000",
          deliveryMethodId: 1,
          paymentMethodId: 1,
          deliveryAddressId: 1,
          deliveryPrice: "0",
          comment: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      // Создаем mock request
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(mockOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Мокаем контекст аутентификации
      const context = { currentUserId: 1 };

      // Динамически импортируем и вызываем handler
      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      // Выполняем запрос
      const response = await handler(request, context);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.order.totalPrice).toBe("70000");
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          cartItems: expect.arrayContaining([
            expect.objectContaining({ name: "Процессор Intel i7" }),
            expect.objectContaining({ name: "Видеокарта RTX 4070" }),
          ]),
        })
      );
    });
  });

  describe("Валидация данных заказа", () => {
    it("должен проверять наличие обязательных полей", async () => {
      // Тест с отсутствующим deliveryMethodId
      const incompleteData = {
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [{ id: 1, name: "Test", price: 1000, quantity: 1 }],
      };

      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(incompleteData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const context = { currentUserId: 1 };

      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      const response = await handler(request, context);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("должен валидировать формат JSON", async () => {
      // Тест с невалидным JSON
      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: "invalid json",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const context = { currentUserId: 1 };

      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;
      const response = await handler(request, context);

      expect(response.status).toBe(500);
    });
  });

  describe("Аутентификация", () => {
    it("должен требовать авторизацию для создания заказа", async () => {
      const mockOrderData = {
        deliveryMethodId: 1,
        paymentMethodId: 1,
        deliveryAddressId: 1,
        cartItems: [{ id: 1, name: "Test", price: 1000, quantity: 1 }],
      };

      const request = new NextRequest("http://localhost:5000/api/orders", {
        method: "POST",
        body: JSON.stringify(mockOrderData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Контекст без пользователя
      const context = {};

      const routeModule = await getHandler();
      const handler = (routeModule as any).handler || routeModule.POST;

      const response = await handler(request, context);

      // Проверяем, что запрос отклонен из-за отсутствия авторизации
      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });
});
