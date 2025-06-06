import React from "react";
import { render, act, renderHook } from "@testing-library/react";
import { CartProvider, useCart } from "@/contexts/CartContext";

// Мок для утилит работы с куками
jest.mock("@/utils/cookieUtils", () => ({
  getStandardCookie: jest.fn(),
  setStandardCookie: jest.fn(),
  COOKIE_KEYS: {
    CART: "onlypc_cart",
  },
}));

const { getStandardCookie, setStandardCookie } = require("@/utils/cookieUtils");

// Тестовые данные
const mockCartItem = {
  id: 1,
  name: "Игровая сборка",
  price: 50000,
  image: "/test-image.jpg",
  slug: "gaming-build",
  type: "build",
  quantity: 1,
  components: {
    cpu: { name: "Intel Core i7-12700K", categoryName: "Процессоры" },
    gpu: { name: "RTX 4070", categoryName: "Видеокарты" },
  },
};

const mockCartItem2 = {
  id: 2,
  name: "Офисная сборка",
  price: 30000,
  image: "/office-image.jpg",
  slug: "office-build",
  type: "build",
  quantity: 1,
};

describe("CartContext", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();
    getStandardCookie.mockReturnValue(null);

    // Сбрасываем моки localStorage
    const mockGetItem = localStorage.getItem as jest.MockedFunction<
      typeof localStorage.getItem
    >;
    const mockSetItem = localStorage.setItem as jest.MockedFunction<
      typeof localStorage.setItem
    >;
    const mockRemoveItem = localStorage.removeItem as jest.MockedFunction<
      typeof localStorage.removeItem
    >;
    const mockClear = localStorage.clear as jest.MockedFunction<
      typeof localStorage.clear
    >;

    mockGetItem.mockReturnValue(null);
    mockSetItem.mockImplementation(() => {});
    mockRemoveItem.mockImplementation(() => {});
    mockClear.mockImplementation(() => {});
  });

  describe("Инициализация контекста", () => {
    it("должен корректно инициализироваться с пустой корзиной", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.cartItems).toEqual([]);
      expect(result.current.getTotalPrice()).toBe(0);
      expect(result.current.getItemsCount()).toBe(0);
    });
    it("должен загружать данные из куков при инициализации", () => {
      const savedCart = [mockCartItem];
      getStandardCookie.mockReturnValue(savedCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.cartItems).toEqual(savedCart);
      expect(result.current.getTotalPrice()).toBe(50000);
      expect(result.current.getItemsCount()).toBe(1);
    });
    it("должен мигрировать данные из localStorage в куки", async () => {
      // Настраиваем моки так, чтобы куки были пустые, но localStorage содержал данные
      getStandardCookie.mockReturnValue(null);

      // Мокаем localStorage.getItem для возврата данных
      const mockGetItem = localStorage.getItem as jest.MockedFunction<
        typeof localStorage.getItem
      >;
      const mockRemoveItem = localStorage.removeItem as jest.MockedFunction<
        typeof localStorage.removeItem
      >;

      mockGetItem.mockImplementation((key) => {
        if (key === "cart") {
          return JSON.stringify([mockCartItem]);
        }
        return null;
      });

      let result: any;

      await act(async () => {
        const hookResult = renderHook(() => useCart(), {
          wrapper: CartProvider,
        });
        result = hookResult.result;
        // Ждем завершения useEffect
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Проверяем, что данные загрузились в контекст
      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0]).toEqual(mockCartItem);
      // Проверяем, что данные сохранились в куки
      expect(setStandardCookie).toHaveBeenCalledWith("onlypc_cart", [
        mockCartItem,
      ]);
      // Проверяем, что localStorage был очищен
      expect(mockRemoveItem).toHaveBeenCalledWith("cart");

      // Сбрасываем моки
      mockGetItem.mockReset();
      mockRemoveItem.mockReset();
    });
  });

  describe("Добавление товаров в корзину", () => {
    it("должен добавлять новый товар в корзину", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0]).toEqual(mockCartItem);
      expect(result.current.getTotalPrice()).toBe(50000);
      expect(result.current.getItemsCount()).toBe(1);
    });

    it("должен увеличивать количество существующего товара", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      act(() => {
        result.current.addToCart({ ...mockCartItem, quantity: 1 });
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].quantity).toBe(2);
      expect(result.current.cartItems[0].price).toBe(100000); // 50000 * 2
      expect(result.current.getTotalPrice()).toBe(100000);
      expect(result.current.getItemsCount()).toBe(2);
    });

    it("должен корректно рассчитывать цену при добавлении товара с количеством больше 1", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const itemWithQuantity = { ...mockCartItem, quantity: 3, price: 150000 }; // 50000 * 3

      act(() => {
        result.current.addToCart(itemWithQuantity);
      });

      expect(result.current.cartItems[0].quantity).toBe(3);
      expect(result.current.cartItems[0].price).toBe(150000);
      expect(result.current.getTotalPrice()).toBe(150000);
      expect(result.current.getItemsCount()).toBe(3);
    });

    it("должен сохранять изменения в куки после добавления", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(setStandardCookie).toHaveBeenCalledWith("onlypc_cart", [
        mockCartItem,
      ]);
    });
  });

  describe("Удаление товаров из корзины", () => {
    it("должен удалять товар из корзины", () => {
      getStandardCookie.mockReturnValue([mockCartItem, mockCartItem2]);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.removeFromCart(1);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].id).toBe(2);
      expect(result.current.getTotalPrice()).toBe(30000);
    });

    it("должен полностью очищать корзину", () => {
      getStandardCookie.mockReturnValue([mockCartItem, mockCartItem2]);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cartItems).toEqual([]);
      expect(result.current.getTotalPrice()).toBe(0);
      expect(result.current.getItemsCount()).toBe(0);
    });
  });

  describe("Обновление количества товаров", () => {
    it("должен обновлять количество товара", () => {
      getStandardCookie.mockReturnValue([mockCartItem]);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.updateItemQuantity(1, 3);
      });

      expect(result.current.cartItems[0].quantity).toBe(3);
      expect(result.current.cartItems[0].price).toBe(150000); // 50000 * 3
      expect(result.current.getTotalPrice()).toBe(150000);
      expect(result.current.getItemsCount()).toBe(3);
    });

    it("должен корректно рассчитывать цену при обновлении количества", () => {
      const itemWithQuantity2 = { ...mockCartItem, quantity: 2, price: 100000 };
      getStandardCookie.mockReturnValue([itemWithQuantity2]);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.updateItemQuantity(1, 1);
      });

      expect(result.current.cartItems[0].quantity).toBe(1);
      expect(result.current.cartItems[0].price).toBe(50000); // базовая цена за единицу
      expect(result.current.getTotalPrice()).toBe(50000);
    });
  });

  describe("Проверка наличия товара в корзине", () => {
    it("должен определять наличие товара в корзине по ID", () => {
      getStandardCookie.mockReturnValue([mockCartItem]);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.isItemInCart(1)).toBe(true);
      expect(result.current.isItemInCart("1")).toBe(true); // проверка строкового ID
      expect(result.current.isItemInCart(999)).toBe(false);
    });
  });

  describe("Расчет общей стоимости и количества", () => {
    it("должен корректно рассчитывать общую стоимость для нескольких товаров", () => {
      const items = [
        { ...mockCartItem, quantity: 2, price: 100000 },
        { ...mockCartItem2, quantity: 1, price: 30000 },
      ];
      getStandardCookie.mockReturnValue(items);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.getTotalPrice()).toBe(130000); // 100000 + 30000
      expect(result.current.getItemsCount()).toBe(3); // 2 + 1
    });

    it("должен обрабатывать товары без указания количества", () => {
      const itemWithoutQuantity = { ...mockCartItem };
      const { quantity, ...itemWithoutQuantityFixed } = itemWithoutQuantity;
      getStandardCookie.mockReturnValue([itemWithoutQuantityFixed]);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.getTotalPrice()).toBe(50000);
      expect(result.current.getItemsCount()).toBe(1);
    });
  });
  describe("Обработка ошибок", () => {
    it("должен обрабатывать некорректные данные в localStorage", async () => {
      getStandardCookie.mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const mockGetItem = localStorage.getItem as jest.MockedFunction<
        typeof localStorage.getItem
      >;
      const mockRemoveItem = localStorage.removeItem as jest.MockedFunction<
        typeof localStorage.removeItem
      >;

      mockGetItem.mockImplementation((key) => {
        if (key === "cart") {
          return "invalid json";
        }
        return null;
      });

      let result: any;

      await act(async () => {
        const hookResult = renderHook(() => useCart(), {
          wrapper: CartProvider,
        });
        result = hookResult.result;
        // Ждем завершения useEffect
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.cartItems).toEqual([]);
      expect(mockRemoveItem).toHaveBeenCalledWith("cart");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Ошибка при загрузке корзины из localStorage:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      mockGetItem.mockReset();
      mockRemoveItem.mockReset();
    });
  });

  describe("Использование хука вне провайдера", () => {
    it("должен выбрасывать ошибку при использовании useCart вне CartProvider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useCart());
      }).toThrow("useCart must be used within a CartProvider");

      consoleSpy.mockRestore();
    });
  });
});
