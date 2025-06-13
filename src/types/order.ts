import { User } from "./user";
import { PcBuildResponse } from "./pcbuild";

// Базовый статус заказа
export interface OrderStatus {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
}

// Способ доставки
export interface DeliveryMethod {
  id: number;
  name: string;
  description: string | null;
  price: string;
  estimatedDays: string | null;
  isActive: boolean;
}

// Способ оплаты
export interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

// Адрес доставки
export interface DeliveryAddress {
  id: number;
  userId: number;
  recipientName: string;
  phoneNumber: string;
  country: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  deliveryMethodId: number | null;
  isDefault: boolean;
}

// Элемент заказа (детали)
export interface OrderItem {
  id: number;
  orderId: number;
  buildId: number | null;
  quantity: number;
  buildSnapshot: {
    id: number;
    name: string;
    components: Record<string, any>;
    totalPrice: string;
    type?: string;
    image?: string;
  } | null;
}

// Запись истории заказа
export interface OrderHistoryRecord {
  id: number;
  orderId: number;
  statusId: number;
  status?: OrderStatus;
  comment: string | null;
  userId: number | null;
  user?: User;
  createdAt: string;
}

// Базовый заказ
export interface OrderBase {
  id: number;
  orderNumber: string;
  userId: number;
  statusId: number;
  totalPrice: string;
  deliveryMethodId: number | null;
  paymentMethodId: number | null;
  deliveryAddressId: number | null;
  deliveryPrice: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// Расширенный заказ со связанными данными
export interface OrderWithRelations extends OrderBase {
  user?: User;
  status?: OrderStatus;
  deliveryMethod?: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  deliveryAddress?: DeliveryAddress;
  items?: OrderItem[];
  history?: OrderHistoryRecord[];
}

// Элемент корзины для создания заказа
export interface CartItemForOrder {
  id: number | string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
  type?: string;
  components?: Record<string, any>;
}

// Запрос на создание заказа
export interface CreateOrderRequest {
  buildId?: number;
  deliveryMethodId: number;
  paymentMethodId: number;
  deliveryAddressId: number;
  statusId?: number; // Статус заказа (опциональный)
  paidAt?: string; // Дата и время оплаты (опциональный)
  paymentStatus?: string; // Статус оплаты (опциональный)
  comment?: string;
  cartItems?: CartItemForOrder[]; // Элементы корзины
}

// Запрос на обновление статуса заказа
export interface UpdateOrderStatusRequest {
  statusId: number;
  comment?: string;
}

// Ответ на запрос о создании заказа
export interface CreateOrderResponse {
  order: OrderWithRelations;
  success: boolean;
  message?: string;
}

// Результат запроса статуса заказа
export interface OrderStatusResponse {
  order: OrderWithRelations;
  success: boolean;
}

// Статистика по заказам (для админки/менеджера)
export interface OrdersStatistics {
  total: number;
  new: number;
  processing: number;
  completed: number;
  cancelled: number;
  totalRevenue: string;
}
