// Setup файл для API тестов
import "@testing-library/jest-dom";

// Подавляем ожидаемые console.error и console.log в API тестах
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  console.error = (...args) => {
    const message = args[0]?.toString() || "";

    // Подавляем ожидаемые ошибки из тестов
    if (
      message.includes("Error creating order:") ||
      message.includes("Login error:") ||
      message.includes("API: Product request error:") ||
      message.includes("Request handling error:")
    ) {
      return;
    }

    originalError.call(console, ...args);
  };

  console.log = (...args) => {
    const message = args[0]?.toString() || "";

    // Подавляем debug логи API
    if (
      message.includes("API Debug:") ||
      message.includes("API: Processing request:")
    ) {
      return;
    }

    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Мокаем API недоступные в тестовой среде
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

// Полифилы для TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Полифилы для Web API, которые используются в Next.js API routes
const { Request, Response, Headers, fetch } = require("undici");

global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;
