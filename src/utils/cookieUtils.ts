import {
  getCookie,
  setCookie,
  deleteCookie,
  CookieValueTypes,
} from "cookies-next";
import { getPreferredStorage } from "./cookieDetection";

// Определяем тип для опций куков
type OptionsType = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  httpOnly?: boolean;
};

/**
 * Базовые настройки для cookies
 */
const DEFAULT_COOKIE_OPTIONS: OptionsType = {
  path: "/",
  sameSite: "lax",
  // По умолчанию куки истекают через 30 дней
  maxAge: 30 * 24 * 60 * 60,
};

/**
 * Настройки для приватных данных
 */
const SECURE_COOKIE_OPTIONS: OptionsType = {
  ...DEFAULT_COOKIE_OPTIONS,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

/**
 * Установка приватного cookie
 */
export const setSecureCookie = (
  name: string,
  value: string | object | boolean,
  options?: OptionsType
) => {
  const cookieValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  setCookie(name, cookieValue as CookieValueTypes, {
    ...SECURE_COOKIE_OPTIONS,
    ...options,
  });
};

/**
 * Получение приватного cookie
 */
export const getSecureCookie = (name: string) => {
  const value = getCookie(name);

  if (!value) return null;

  // Пытаемся преобразовать JSON, если это возможно
  try {
    return JSON.parse(value as string);
  } catch (e) {
    return value;
  }
};

/**
 * Установка стандартного cookie
 */
export const setStandardCookie = (
  name: string,
  value: string | object | boolean,
  options?: OptionsType
) => {
  const cookieValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  setCookie(name, cookieValue as CookieValueTypes, {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options,
  });
};

/**
 * Получение стандартного cookie
 */
export const getStandardCookie = (name: string) => {
  const value = getCookie(name);

  if (!value) return null;

  try {
    return JSON.parse(value as string);
  } catch (e) {
    return value;
  }
};

/**
 * Удаление cookie
 */
export const removeCookie = (name: string, options?: OptionsType) => {
  deleteCookie(name, { path: "/", ...options });
};

/**
 * Функция для гибкого сохранения данных с выбором метода хранения
 */
export const setFlexibleStorage = (
  key: string,
  value: string | object | boolean,
  options?: OptionsType
) => {
  const { preferCookies } = getPreferredStorage();
  const valueStr =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  if (preferCookies) {
    // Если куки доступны, используем их
    setCookie(key, valueStr as CookieValueTypes, {
      ...DEFAULT_COOKIE_OPTIONS,
      ...options,
    });
  } else {
    // Иначе используем localStorage
    try {
      localStorage.setItem(key, valueStr);
    } catch (e) {
      console.error(`Ошибка при сохранении ${key} в localStorage:`, e);
    }
  }
};

/**
 * Функция для гибкого получения данных с учётом метода хранения
 */
export const getFlexibleStorage = (key: string) => {
  const { preferCookies } = getPreferredStorage();

  let value;

  if (preferCookies) {
    // Если куки доступны, используем их
    value = getCookie(key);
  } else {
    // Иначе используем localStorage
    try {
      value = localStorage.getItem(key);
    } catch (e) {
      console.error(`Ошибка при получении ${key} из localStorage:`, e);
    }
  }

  if (!value) return null;

  // Пытаемся преобразовать JSON, если это возможно
  try {
    return JSON.parse(value as string);
  } catch (e) {
    return value;
  }
};

/**
 * Функция для гибкого удаления данных с учётом метода хранения
 */
export const removeFlexibleStorage = (key: string, options?: OptionsType) => {
  const { preferCookies } = getPreferredStorage();

  if (preferCookies) {
    // Если куки доступны, используем их
    deleteCookie(key, { path: "/", ...options });
  } else {
    // Иначе используем localStorage
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Ошибка при удалении ${key} из localStorage:`, e);
    }
  }
};

// Ключи для различных типов данных
export const COOKIE_KEYS = {
  CART: "onlypc_cart",
  FAVORITES: "onlypc_favorites",
  CONFIGURATOR: "onlypc_configurator",
  THEME: "onlypc_theme",
  CHECKOUT: "onlypc_checkout",
};
