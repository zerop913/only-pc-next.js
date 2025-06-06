// Setup файл для тестов компонентов
import "@testing-library/jest-dom";

// Подавляем предупреждения console в тестах
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Not implemented: navigation") ||
        args[0].includes(
          "Your app (or one of its dependencies) is using an outdated JSX transform"
        ))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes(
        "Your app (or one of its dependencies) is using an outdated JSX transform"
      )
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Мокаем API недоступные в тестовой среде
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

// Мокаем функции браузера для jsdom тестов
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });

  // Мокаем window.history
  Object.defineProperty(window, "history", {
    value: {
      pushState: jest.fn(),
      replaceState: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      go: jest.fn(),
    },
    writable: true,
  });
}
