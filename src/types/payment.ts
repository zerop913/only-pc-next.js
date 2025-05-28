export interface CardPaymentDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

export interface PaymentRequest {
  orderId: number;
  paymentMethodId: number;
  amount: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  message?: string;
}

export interface QrPaymentDetails {
  qrCodeData: string;
  paymentId: string;
  amount: string;
  orderDetails: {
    orderNumber: string;
    items: Array<{
      name: string;
      price: string;
      quantity: number;
    }>;
    deliveryMethod: {
      name: string;
      price: string;
    };
    totalPrice: string;
  };
}

export interface PendingOrder {
  id: number;
  orderNumber: string;
  totalPrice: string;
  items: any[];
  deliveryMethod: {
    name: string;
    price: string;
  };
  paymentMethod: {
    id: number;
    name: string;
  };
  deliveryAddress: {
    recipientName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    postalCode: string;
  };
}
