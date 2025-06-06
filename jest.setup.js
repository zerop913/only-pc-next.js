import "@testing-library/jest-dom";

// Мокаем API недоступные в тестовой среде
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { Request, Response, Headers, fetch } = require("undici");

global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;

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

  Object.defineProperty(document, "cookie", {
    value: "",
    writable: true,
  });
}

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => "/"),
}));
