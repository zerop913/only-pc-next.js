import React from "react";
import {
  Body,
  Container,
  Column,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }[];
  deliveryMethod: string;
  deliveryAddress: string;
  paymentMethod: string;
  subtotal: number;
  deliveryPrice: number;
  totalPrice: number;
}

export const OrderConfirmationEmail = ({
  orderNumber,
  customerName,
  orderDate,
  items,
  deliveryMethod,
  deliveryAddress,
  paymentMethod,
  subtotal,
  deliveryPrice,
  totalPrice,
}: OrderConfirmationEmailProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Html>
      <Head />
      <Preview>Подтверждение заказа #{orderNumber} - OnlyPC</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                primary: {
                  DEFAULT: "#0E0F18",
                  dark: "#0A0B14",
                  border: "#1F1E24",
                  light: "#1A1B23",
                },
                secondary: {
                  DEFAULT: "#9D9EA6",
                  dark: "#6D6E7A",
                  light: "#B8B9C3",
                },
                gradient: {
                  from: "#1D1E2C",
                  to: "#252736",
                },
                blue: {
                  400: "#60a5fa",
                  500: "#3b82f6",
                  600: "#2563eb",
                },
              },
              boxShadow: {
                sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              },
              fontFamily: {
                sans: ["Montserrat Alternates", "sans-serif"],
              },
            },
          },
        }}
      >
        <Body className="bg-primary-dark font-sans">
          <Container className="max-w-[700px] mx-auto my-12">
            {/* Верхний блок */}
            <Section className="p-8 bg-gradient-from/20 rounded-2xl border-2 border-primary-border/50 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden w-full mb-8">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30" />

              <Row>
                <Column className="w-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-from/40 rounded-xl p-2.5 border border-blue-500/20">
                        <Img
                          src="https://only-pc.ru/logo.svg"
                          alt="OnlyPC Logo"
                          width="28"
                          height="28"
                          className="w-full h-full"
                        />
                      </div>
                      <Text className="text-blue-400 text-2xl font-semibold m-0">
                        OnlyPC
                      </Text>
                    </div>
                    <div className="px-5 py-2.5 bg-gradient-from/40 rounded-xl border border-blue-500/30">
                      <Text className="text-blue-400 text-base font-medium m-0">
                        Заказ #{orderNumber}
                      </Text>
                    </div>
                  </div>
                  <Text className="text-white text-3xl font-bold mb-4">
                    Заказ подтвержден
                  </Text>
                  <Text className="text-secondary-light text-lg leading-relaxed">
                    Здравствуйте, {customerName}! <br />
                    Благодарим за ваш заказ от {orderDate}.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Блок с информацией о заказе */}
            <Section className="p-8 bg-gradient-from/20 rounded-2xl border-2 border-primary-border/50 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden w-full mb-8">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30" />

              <Row>
                <Column>
                  <Text className="text-white text-2xl font-bold mb-8">
                    Состав заказа
                  </Text>

                  {items.map((item) => (
                    <Row
                      key={item.id}
                      className="mb-5 p-5 bg-gradient-from/30 rounded-xl border border-blue-500/20"
                    >
                      <Column>
                        <Text className="text-white text-lg font-medium m-0">
                          {item.name}
                        </Text>
                        <div className="flex justify-between items-center mt-3">
                          <Text className="text-secondary-light text-base m-0">
                            {formatCurrency(item.price)} × {item.quantity} шт.
                          </Text>
                          <Text className="text-blue-400 text-lg font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </Text>
                        </div>
                      </Column>
                    </Row>
                  ))}

                  <Hr className="border-t-2 border-blue-500/20 my-8" />

                  <div className="space-y-4 px-2">
                    <Row>
                      <Column>
                        <Text className="text-secondary-light text-base m-0">
                          Стоимость товаров:
                        </Text>
                      </Column>
                      <Column className="text-right">
                        <Text className="text-white text-lg font-medium m-0">
                          {formatCurrency(subtotal)}
                        </Text>
                      </Column>
                    </Row>
                    <Row>
                      <Column>
                        <Text className="text-secondary-light text-base m-0">
                          Стоимость доставки:
                        </Text>
                      </Column>
                      <Column className="text-right">
                        <Text className="text-white text-lg font-medium m-0">
                          {formatCurrency(deliveryPrice)}
                        </Text>
                      </Column>
                    </Row>
                    <Row className="mt-6 pt-6 border-t-2 border-blue-500/20">
                      <Column>
                        <Text className="text-blue-400 text-xl font-bold m-0">
                          Итого к оплате:
                        </Text>
                      </Column>
                      <Column className="text-right">
                        <Text className="text-blue-400 text-3xl font-bold m-0">
                          {formatCurrency(totalPrice)}
                        </Text>
                      </Column>
                    </Row>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Блок с информацией о доставке и оплате */}
            <Section className="p-8 bg-gradient-from/20 rounded-2xl border-2 border-primary-border/50 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden w-full mb-8">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30" />

              <Row className="flex items-stretch">
                <Column className="w-1/2 pr-4">
                  <div className="flex flex-col p-6 bg-gradient-from/30 rounded-xl border border-blue-500/20 h-full">
                    <Text className="text-white text-xl font-bold mb-4">
                      Информация о доставке
                    </Text>
                    <div className="flex flex-col flex-grow">
                      <Text className="text-blue-400 text-lg mb-2">
                        {deliveryMethod}
                      </Text>
                      <Text className="text-secondary-light text-base">
                        {deliveryAddress}
                      </Text>
                    </div>
                  </div>
                </Column>
                <Column className="w-1/2 pl-4">
                  <div className="flex flex-col p-6 bg-gradient-from/30 rounded-xl border border-blue-500/20 h-full">
                    <Text className="text-white text-xl font-bold mb-4">
                      Способ оплаты
                    </Text>
                    <div className="flex flex-col flex-grow">
                      <Text className="text-blue-400 text-lg">
                        {paymentMethod}
                      </Text>
                    </div>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Дополнительная информация и контакты */}
            <Section className="text-center mt-10">
              <Text className="text-secondary-light text-lg mb-4">
                Если у вас возникли вопросы по заказу, свяжитесь с нами:
              </Text>
              <Link
                href="mailto:support@only-pc.ru"
                className="text-blue-400 hover:text-blue-500 text-xl font-medium no-underline transition-colors duration-300"
              >
                support@only-pc.ru
              </Link>
              <Text className="text-secondary-dark text-base mt-10">
                © {new Date().getFullYear()} OnlyPC. Все права защищены.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmationEmail;
