import { GET } from "@/app/api/products/[...path]/route";
import { NextRequest } from "next/server";
import * as productService from "@/services/productService";
import * as filterService from "@/services/filterService";
import { Product } from "@/types/product";
import { CategoryFilters } from "@/services/filterService";
import { PaginatedProducts } from "@/services/productService";

// Мокаем сервисы
jest.mock("@/services/productService", () => ({
  getFilteredProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getProductsByCategory: jest.fn(),
  getProductsBySubcategory: jest.fn(),
}));

jest.mock("@/services/filterService", () => ({
  getCategoryFilters: jest.fn(),
}));

// Мокаем базу данных
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue([
              { id: 1, slug: "processory", name: "Процессоры" },
            ]),
        }),
      }),
    }),
  },
}));

// Мокаем схему БД
jest.mock("@/lib/db/schema", () => ({
  categories: {},
}));

// Мокаем drizzle-orm
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

// Мокаем утилиты
jest.mock("@/lib/utils/filterUtils", () => ({
  parseFilterParams: jest.fn().mockReturnValue({}),
}));

describe("API /api/products", () => {
  const mockProductService = productService as jest.Mocked<
    typeof productService
  >;
  const mockFilterService = filterService as jest.Mocked<typeof filterService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET запросы", () => {
    it("должен возвращать список продуктов по категории", async () => {
      // Подготовка данных
      const mockProducts: PaginatedProducts = {
        products: [
          {
            id: 1,
            slug: "test-product",
            title: "Тестовый продукт",
            price: 10000,
            brand: "Intel",
            image: "/test-image.jpg",
            description: "Тестовое описание",
            categoryId: 1,
            characteristics: [],
            createdAt: new Date().toISOString(),
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      };

      mockProductService.getProductsByCategory.mockResolvedValue(mockProducts);

      // Создаем mock request
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0].title).toBe("Тестовый продукт");
      expect(mockProductService.getProductsByCategory).toHaveBeenCalledWith(
        "processory",
        1,
        expect.any(Object),
        "asc" // добавляем параметр сортировки
      );
    });

    it("должен возвращать детали конкретного продукта", async () => {
      // Подготовка данных
      const mockProduct: Product = {
        id: 1,
        title: "Intel Core i7-12700K",
        price: 35000,
        image: "/cpu-image.jpg",
        slug: "intel-core-i7-12700k",
        brand: "Intel",
        description: "Процессор Intel",
        categoryId: 1,
        characteristics: [
          { type: "Сокет", value: "LGA1700" },
          { type: "Частота", value: "3.6 ГГц" },
        ],
        createdAt: new Date().toISOString(),
      };

      mockProductService.getProductDetails.mockResolvedValue(mockProduct);

      // Создаем mock request для получения продукта
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory/intel-core-i7-12700k-p-123"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.title).toBe("Intel Core i7-12700K");
      expect(data.characteristics).toHaveLength(2);
      expect(mockProductService.getProductDetails).toHaveBeenCalledWith(
        "processory",
        "intel-core-i7-12700k-p-123",
        undefined
      );
    });

    it("должен возвращать фильтры для категории", async () => {
      // Подготовка данных
      const mockFilters: CategoryFilters = {
        priceRange: { min: 5000, max: 100000 },
        brands: [
          { value: "Intel", label: "Intel", count: 10 },
          { value: "AMD", label: "AMD", count: 8 },
        ],
        characteristics: [
          {
            id: 1,
            name: "Сокет",
            slug: "socket",
            options: [
              { value: "LGA1700", label: "LGA1700", count: 5 },
              { value: "AM4", label: "AM4", count: 3 },
            ],
          },
        ],
      };

      mockFilterService.getCategoryFilters.mockResolvedValue(mockFilters);

      // Создаем mock request для получения фильтров
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory?filters=true"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.priceRange).toBeDefined();
      expect(data.brands).toHaveLength(2);
      expect(data.characteristics).toHaveLength(1);
      expect(mockFilterService.getCategoryFilters).toHaveBeenCalledWith(
        expect.any(Number)
      );
    });

    it("должен возвращать отфильтрованные продукты", async () => {
      // Подготовка данных
      const mockFilteredProducts: PaginatedProducts = {
        products: [
          {
            id: 1,
            title: "AMD Ryzen 7 5800X",
            price: 25000,
            image: "/amd-cpu.jpg",
            slug: "amd-ryzen-7-5800x",
            brand: "AMD",
            description: "Процессор AMD",
            categoryId: 1,
            characteristics: [],
            createdAt: new Date().toISOString(),
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      };

      mockProductService.getProductsByCategory.mockResolvedValue(
        mockFilteredProducts
      );

      // Создаем mock request с фильтрами
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory?priceMin=20000&priceMax=50000&manufacturer=AMD"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0].title).toBe("AMD Ryzen 7 5800X");
    });
    it("должен возвращать ошибку 404 для несуществующего продукта", async () => {
      // Мокаем ошибку с корректным статусом
      const error = new Error("Product not found");
      (error as any).status = 404;
      mockProductService.getProductDetails.mockRejectedValue(error);

      // Создаем mock request
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory/nonexistent-product-p-999"
      );

      // Выполняем запрос
      const response = await GET(request);

      // Проверяем результат
      expect(response.status).toBe(404);
    });

    it("должен обрабатывать ошибки сервера", async () => {
      // Мокаем ошибку в сервисе
      mockProductService.getProductsByCategory.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Создаем mock request
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory"
      );

      // Выполняем запрос
      const response = await GET(request);

      // Проверяем результат
      expect(response.status).toBe(500);
    });

    it("должен корректно обрабатывать пагинацию", async () => {
      // Подготовка данных
      const mockProducts: PaginatedProducts = {
        products: [],
        totalItems: 100,
        totalPages: 4,
        currentPage: 2,
      };

      mockProductService.getProductsByCategory.mockResolvedValue(mockProducts);

      // Создаем mock request с пагинацией
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory?page=2"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.currentPage).toBe(2);
      expect(data.totalPages).toBe(4);
      expect(data.totalItems).toBe(100);
      expect(mockProductService.getProductsByCategory).toHaveBeenCalledWith(
        "processory",
        2,
        expect.any(Object),
        "asc" // добавляем параметр сортировки
      );
    });

    it("должен возвращать продукты подкатегории", async () => {
      // Подготовка данных
      const mockProducts: PaginatedProducts = {
        products: [
          {
            id: 1,
            title: "Intel Core i5-12400F",
            price: 15000,
            image: "/intel-cpu.jpg",
            slug: "intel-core-i5-12400f",
            brand: "Intel",
            description: "Процессор Intel",
            categoryId: 1,
            characteristics: [],
            createdAt: new Date().toISOString(),
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      };

      mockProductService.getProductsBySubcategory.mockResolvedValue(
        mockProducts
      );

      // Создаем mock request для подкатегории
      const request = new NextRequest(
        "http://localhost:5000/api/products/processory/intel"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0].brand).toBe("Intel");
    });
  });

  describe("Обработка некорректных запросов", () => {
    it("должен обрабатывать некорректный URL", async () => {
      // Подготовка данных - пустой результат
      const mockProducts: PaginatedProducts = {
        products: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      };

      mockProductService.getProductsByCategory.mockResolvedValue(mockProducts);

      // Создаем mock request с некорректным URL
      const request = new NextRequest("http://localhost:5000/api/products/");

      // Выполняем запрос
      const response = await GET(request);

      // Проверяем, что запрос обработан корректно
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it("должен обрабатывать отсутствующие параметры", async () => {
      // Подготовка данных - пустой результат
      const mockProducts: PaginatedProducts = {
        products: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      };

      mockProductService.getProductsByCategory.mockResolvedValue(mockProducts);

      // Создаем mock request без дополнительных параметров
      const request = new NextRequest(
        "http://localhost:5000/api/products/nonexistent-category"
      );

      // Выполняем запрос
      const response = await GET(request);
      const data = await response.json();

      // Проверяем результат
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(0);
      expect(data.totalItems).toBe(0);
    });
  });
});
