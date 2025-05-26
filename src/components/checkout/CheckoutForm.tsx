"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CustomerInfoForm from "./CustomerInfoForm";
import DeliveryMethodSelector from "./DeliveryMethodSelector";
import DeliveryAddressForm from "./DeliveryAddressForm";
import PaymentMethodSelector from "./PaymentMethodSelector";
import OrderSummary from "./OrderSummary";
import { DeliveryMethod, PaymentMethod } from "@/types/order";

export default function CheckoutForm() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    middleName: "", // Добавляем поле для отчества
    phone: user?.profile?.phoneNumber || "",
  });

  // Обновляем данные доставки при изменении данных покупателя
  useEffect(() => {
    setDeliveryAddress((prev) => ({
      ...prev,
      recipientName:
        `${customerInfo.lastName} ${customerInfo.firstName} ${customerInfo.middleName}`.trim(),
      phoneNumber: customerInfo.phone,
    }));
  }, [customerInfo]);

  const [selectedDeliveryMethod, setSelectedDeliveryMethod] =
    useState<DeliveryMethod | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    recipientName:
      `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`.trim(),
    phoneNumber: user?.profile?.phoneNumber || "",
    city: "",
    postalCode: "",
    streetAddress: "",
    isDefault: true,
  });

  const [formErrors, setFormErrors] = useState({
    customerInfo: false,
    deliveryMethod: false,
    deliveryAddress: false,
    paymentMethod: false,
  });

  useEffect(() => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [user, router]); // Обработка отправки формы
  const handleSubmit = async () => {
    console.log("Данные формы:", {
      customerInfo,
      deliveryAddress,
      selectedDeliveryMethod,
      selectedPaymentMethod,
    });

    // Подробная проверка полей
    const missingFields = [];
    if (!customerInfo.firstName) missingFields.push("Имя покупателя");
    if (!customerInfo.lastName) missingFields.push("Фамилия покупателя");
    if (!customerInfo.phone) missingFields.push("Телефон покупателя");
    if (!deliveryAddress.city) missingFields.push("Город доставки");
    if (!deliveryAddress.postalCode) missingFields.push("Почтовый индекс");
    if (!deliveryAddress.streetAddress) missingFields.push("Адрес доставки");
    if (!deliveryAddress.recipientName) missingFields.push("ФИО получателя");
    if (!deliveryAddress.phoneNumber) missingFields.push("Телефон получателя");
    if (!selectedDeliveryMethod) missingFields.push("Способ доставки");
    if (!selectedPaymentMethod) missingFields.push("Способ оплаты");

    if (missingFields.length > 0) {
      console.log("Незаполненные поля:", missingFields);
    }
    // Проверяем заполнение всех обязательных полей
    const errors = {
      customerInfo:
        !customerInfo.firstName ||
        !customerInfo.lastName ||
        !customerInfo.phone,
      deliveryMethod: !selectedDeliveryMethod,
      deliveryAddress:
        !deliveryAddress.city ||
        !deliveryAddress.postalCode ||
        !deliveryAddress.streetAddress ||
        !deliveryAddress.recipientName ||
        !deliveryAddress.phoneNumber,
      paymentMethod: !selectedPaymentMethod,
    };

    setFormErrors(errors);

    // Если есть ошибки, прекращаем отправку
    if (Object.values(errors).some((error) => error)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Формируем полное имя (Фамилия Имя Отчество)
      const fullName =
        `${customerInfo.lastName} ${customerInfo.firstName} ${customerInfo.middleName}`.trim();

      // Создаем адрес доставки с полным ФИО
      const deliveryAddressData = {
        ...deliveryAddress,
        recipientName: fullName,
      };

      // Отправляем запрос на создание адреса
      const addressResponse = await fetch("/api/orders/delivery-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryAddressData),
      });

      const addressData = await addressResponse.json();

      if (!addressResponse.ok || !addressData.success) {
        throw new Error(addressData.error || "Ошибка при создании адреса");
      } // Получаем информацию о первом товаре в корзине для создания заказа
      const firstItem = cartItems[0];

      console.log("Данные товара из корзины:", firstItem);

      if (!firstItem || !firstItem.id) {
        throw new Error("Некорректные данные товара в корзине");
      }

      // Формируем данные заказа
      const orderData = {
        buildId: firstItem.id,
        deliveryMethodId: selectedDeliveryMethod?.id,
        paymentMethodId: selectedPaymentMethod?.id,
        deliveryAddressId: addressData.address.id,
        comment: "",
      };
      console.log("Отправляем данные заказа:", orderData);

      // Отправляем запрос на создание заказа
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.error || "Ошибка при создании заказа");
      } // Очищаем корзину после успешного оформления заказа
      clearCart();

      // Перенаправляем на страницу успешного оформления заказа
      router.push(
        `/checkout/success?orderNumber=${orderResult.order.orderNumber}`
      );
    } catch (error) {
      console.error("Ошибка при оформлении заказа:", error);
      alert(
        "Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Левая колонка - формы */}
      <motion.div
        className="lg:col-span-8 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Информация о покупателе */}
        <CustomerInfoForm
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          hasError={formErrors.customerInfo}
        />

        {/* Способ доставки */}
        <DeliveryMethodSelector
          selectedMethod={selectedDeliveryMethod}
          setSelectedMethod={setSelectedDeliveryMethod}
          hasError={formErrors.deliveryMethod}
        />

        {/* Адрес доставки */}
        <DeliveryAddressForm
          selectedDeliveryMethod={selectedDeliveryMethod}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          hasError={formErrors.deliveryAddress}
        />

        {/* Способ оплаты */}
        <PaymentMethodSelector
          selectedMethod={selectedPaymentMethod}
          setSelectedMethod={setSelectedPaymentMethod}
          hasError={formErrors.paymentMethod}
        />
      </motion.div>

      {/* Правая колонка - сводка заказа */}
      <motion.div
        className="lg:col-span-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <OrderSummary
          cartItems={cartItems}
          subtotal={getTotalPrice()}
          deliveryPrice={selectedDeliveryMethod?.price || "0"}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </motion.div>
    </div>
  );
}
