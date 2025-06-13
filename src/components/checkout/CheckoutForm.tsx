"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CustomerInfoForm from "./CustomerInfoForm";
import DeliveryMethodSelector from "./DeliveryMethodSelector";
import DeliveryAddressForm from "./DeliveryAddressForm";
import PaymentMethodSelector from "./PaymentMethodSelector";
import OrderSummary from "./OrderSummary";
import { DeliveryMethod, PaymentMethod, DeliveryAddress } from "@/types/order";

export default function CheckoutForm() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { checkoutData, setCheckoutData } = useCheckout();
  const { user } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAddresses, setUserAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    number | null
  >(null);
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

  // Обработчик изменения метода доставки с обновлением deliveryMethodId
  const handleDeliveryMethodChange = (method: DeliveryMethod | null) => {
    setSelectedDeliveryMethod(method);

    if (method) {
      // Обновляем deliveryMethodId в адресе
      setDeliveryAddress((prev) => ({
        ...prev,
        deliveryMethodId: method.id,
      }));

      // Если выбран сохраненный адрес, проверяем, подходит ли он для выбранного метода доставки
      if (selectedSavedAddressId) {
        const selectedAddress = userAddresses.find(
          (addr) => addr.id === selectedSavedAddressId
        );
        if (
          selectedAddress &&
          selectedAddress.deliveryMethodId !== null &&
          selectedAddress.deliveryMethodId !== method.id
        ) {
          // Если метод доставки адреса не совпадает с выбранным, сбрасываем выбор адреса
          setSelectedSavedAddressId(null);
          // Можно показать сообщение пользователю, что адрес не подходит для выбранного метода доставки
        }
      }

      // Фильтруем адреса, подходящие для выбранного метода доставки
      const compatibleAddresses = userAddresses.filter(
        (addr) =>
          addr.deliveryMethodId === null || addr.deliveryMethodId === method.id
      );

      // Если есть совместимые адреса и нет выбранного адреса, выбираем первый подходящий с isDefault=true
      if (compatibleAddresses.length > 0 && !selectedSavedAddressId) {
        const defaultAddress = compatibleAddresses.find(
          (addr) => addr.isDefault
        );
        if (defaultAddress) {
          setSelectedSavedAddressId(defaultAddress.id);
          setDeliveryAddress({
            recipientName: defaultAddress.recipientName,
            phoneNumber: defaultAddress.phoneNumber,
            city: defaultAddress.city,
            postalCode: defaultAddress.postalCode,
            streetAddress: defaultAddress.streetAddress,
            isDefault: defaultAddress.isDefault,
            deliveryMethodId: method.id,
          });
        }
      }
    }
  };
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
    deliveryMethodId: null as number | null,
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
    } else {
      // Загружаем адреса пользователя
      loadUserAddresses();
    }
  }, [user, router]);

  // Функция загрузки адресов пользователя
  const loadUserAddresses = async () => {
    try {
      const response = await fetch("/api/orders/delivery-addresses");
      const data = await response.json();

      if (data.addresses && Array.isArray(data.addresses)) {
        setUserAddresses(data.addresses);

        // Ищем адрес по умолчанию
        const defaultAddress = data.addresses.find(
          (addr: DeliveryAddress) => addr.isDefault
        );

        if (defaultAddress) {
          setSelectedSavedAddressId(defaultAddress.id);
          // Заполняем форму данными адреса по умолчанию
          setDeliveryAddress({
            recipientName: defaultAddress.recipientName,
            phoneNumber: defaultAddress.phoneNumber,
            city: defaultAddress.city,
            postalCode: defaultAddress.postalCode,
            streetAddress: defaultAddress.streetAddress,
            isDefault: defaultAddress.isDefault,
            deliveryMethodId: defaultAddress.deliveryMethodId,
          });
        }
      }
    } catch (error) {
      console.error("Ошибка при загрузке адресов пользователя:", error);
    }
  };

  // Обработчик выбора сохраненного адреса
  const handleSavedAddressSelect = (addressId: number) => {
    const selectedAddress = userAddresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      setSelectedSavedAddressId(addressId);
      setDeliveryAddress({
        recipientName: selectedAddress.recipientName,
        phoneNumber: selectedAddress.phoneNumber,
        city: selectedAddress.city,
        postalCode: selectedAddress.postalCode,
        streetAddress: selectedAddress.streetAddress,
        isDefault: selectedAddress.isDefault,
        deliveryMethodId: selectedAddress.deliveryMethodId,
      });
    }
  }; // Обработка отправки формы
  const handleSubmit = async () => {
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
      let addressId;

      // Если выбран существующий адрес, используем его
      if (selectedSavedAddressId) {
        addressId = selectedSavedAddressId;
      } else {
        // Если выбран новый адрес, создаём его
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
        }

        addressId = addressData.address.id;
      }

      // Получаем информацию о первом товаре в корзине для создания заказа
      const firstItem = cartItems[0];

      if (!firstItem || !firstItem.id) {
        throw new Error("Некорректные данные товара в корзине");
      }

      // Рассчитываем общую стоимость
      const subtotal = getTotalPrice();
      const deliveryPriceNumber = selectedDeliveryMethod?.price
        ? parseFloat(selectedDeliveryMethod.price)
        : 0;

      // Обновляем данные в контексте CheckoutContext перед переходом на страницу оплаты
      setCheckoutData({
        buildId: Number(firstItem.id),
        deliveryMethodId: selectedDeliveryMethod?.id || null,
        deliveryMethod: selectedDeliveryMethod,
        paymentMethodId: selectedPaymentMethod?.id || null,
        paymentMethod: selectedPaymentMethod,
        deliveryAddressId: addressId,
        comment: "",
        subtotal: subtotal,
        deliveryPrice: deliveryPriceNumber,
        total: subtotal + deliveryPriceNumber,
      });

      // Определяем метод оплаты и перенаправляем на соответствующую страницу
      let paymentMethodName = "";

      // Определяем метод оплаты по ID
      if (selectedPaymentMethod?.name.toLowerCase().includes("карт")) {
        paymentMethodName = "card";
      } else if (
        selectedPaymentMethod?.name.toLowerCase().includes("qr") ||
        selectedPaymentMethod?.name.toLowerCase().includes("сбп")
      ) {
        paymentMethodName = "qrcode";
      } else {
        // По умолчанию используем карту
        paymentMethodName = "card";
      }

      // Перенаправляем на страницу оплаты - больше не используем параметры URL
      // вместо этого используем данные из контекста
      router.push(`/checkout/payment/${paymentMethodName}`);
    } catch (error) {
      console.error("Ошибка при оформлении заказа:", error);
      alert(
        "Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз."
      );
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
        />{" "}
        {/* Способ доставки */}
        <DeliveryMethodSelector
          selectedMethod={selectedDeliveryMethod}
          setSelectedMethod={(value) => {
            const method =
              typeof value === "function"
                ? value(selectedDeliveryMethod)
                : value;
            handleDeliveryMethodChange(method);
          }}
          hasError={formErrors.deliveryMethod}
        />{" "}
        {/* Адрес доставки */}
        <DeliveryAddressForm
          selectedDeliveryMethod={selectedDeliveryMethod}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          savedAddresses={userAddresses}
          selectedSavedAddressId={selectedSavedAddressId}
          onSavedAddressSelect={handleSavedAddressSelect}
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
