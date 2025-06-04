export interface OrderStatus {
  id: number;
  name: string;
  color?: string | undefined;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  items: number;
  date: string;
  email?: string;
  user?: {
    email: string;
    profile: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
} 