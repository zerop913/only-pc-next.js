export const PAGE_TITLES = {
  // Основные страницы
  HOME: "OnlyPC - Удобный конфигуратор для сборки ПК и продажа готовых сборок",
  CONFIGURATOR: "Конфигуратор ПК - Собери свой идеальный компьютер | OnlyPC",
  CATALOG: "Каталог готовых сборок ПК - Выбери свою конфигурацию | OnlyPC",

  // Корзина и оформление
  CART: "Корзина - Ваши выбранные товары | OnlyPC",
  CHECKOUT: "Оформление заказа | OnlyPC",
  CHECKOUT_PAYMENT: "Оплата заказа | OnlyPC",
  CHECKOUT_SUCCESS: "Заказ успешно оформлен - Спасибо за покупку | OnlyPC",

  // Пользователь
  PROFILE: "Личный кабинет - Управление профилем | OnlyPC",
  PROFILE_ORDERS: "Мои заказы - История покупок | OnlyPC",
  FAVORITES: "Избранное | OnlyPC",

  // Поиск и товары
  SEARCH: "Поиск по каталогу | OnlyPC",
  PRODUCT: "Готовая сборка ПК - Подробная информация | OnlyPC",
  // Информационные страницы
  FAQ: "Часто задаваемые вопросы - Помощь и поддержка | OnlyPC",
  PRIVACY: "Политика конфиденциальности - Защита данных | OnlyPC",
  TERMS: "Условия использования - Правила сервиса | OnlyPC",

  // Аутентификация
  LOGIN: "Вход в аккаунт - OnlyPC",
  REGISTER: "Регистрация - OnlyPC",
  VERIFY: "Подтверждение email - OnlyPC",

  // Админ и менеджер
  ADMIN: "Панель администратора - Управление системой | OnlyPC",
  MANAGER: "Панель менеджера - Управление заказами | OnlyPC",
  // Ошибки
  NOT_FOUND: "Страница не найдена - OnlyPC",
  SERVER_ERROR: "Ошибка сервера - OnlyPC",

  // Динамические заголовки
  CATEGORY: (categoryName: string) =>
    `${categoryName} - Каталог сборок ПК | OnlyPC`,
  ORDER_DETAIL: (orderNumber: string) =>
    `Заказ #${orderNumber} - Детали заказа | OnlyPC`,
  PRODUCT_DETAIL: (productName: string) => `${productName} | OnlyPC`,
} as const;

// Базовый заголовок для fallback
export const DEFAULT_TITLE =
  "OnlyPC - Конфигуратор и продажа готовых сборок ПК";

// Функция для получения полного заголовка с брендом
export const getPageTitle = (title: string): string => {
  return title.includes("OnlyPC") ? title : `${title} | OnlyPC`;
};

export const META_DESCRIPTIONS = {
  HOME: "Создайте идеальную сборку ПК с нашим конфигуратором или выберите готовую конфигурацию. Качественные комплектующие, выгодные цены, быстрая доставка.",
  CONFIGURATOR:
    "Интерактивный конфигуратор ПК поможет собрать компьютер под ваши задачи и бюджет. Проверка совместимости, расчет производительности.",
  CATALOG:
    "Большой выбор готовых сборок ПК для игр, работы и творчества. Проверенные конфигурации от экспертов по выгодным ценам.",
} as const;
