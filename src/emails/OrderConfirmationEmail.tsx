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

  // Обновленная более яркая цветовая схема
  const primaryColor = "#131421"; // Немного светлее для основных элементов
  const primaryDarkColor = "#0D0E19"; // Фон страницы (темный, но не совсем черный)
  const primaryBorderColor = "#343656"; // Более заметные границы для контраста
  const secondaryColor = "#AEB0BD"; // Светлее для лучшей читаемости
  const secondaryDarkColor = "#7E808F"; // Средний серый для меньшей важности текста
  const secondaryLightColor = "#E0E0E9"; // Почти белый для основного текста
  const gradientFromColor = "#212235"; // Более светлый градиент для фона карточек
  const gradientToColor = "#282A3D"; // Более светлый конечный цвет градиента
  const accentColor = "#4F92FF"; // Более яркий и насыщенный синий
  const accentLightColor = "#75A8FF"; // Светлый синий для эффектов наведения
  const highlightColor = "#9D6FFF"; // Более яркий фиолетовый для акцентов

  // Стиль для основного блока (без позиционированной полосы)
  const sectionStyle = {
    padding: "0",
    backgroundColor: gradientFromColor,
    backgroundImage: `linear-gradient(145deg, ${gradientFromColor}, ${gradientToColor})`,
    borderRadius: "16px",
    border: `2px solid ${primaryBorderColor}`,
    overflow: "hidden" as "hidden",
    marginBottom: "32px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  };

  // Новый стиль для содержимого секции с паддингами
  const sectionContentStyle = {
    padding: "32px",
  };

  const cardStyle = {
    padding: "20px",
    backgroundColor: primaryColor,
    borderRadius: "12px",
    border: `1px solid ${primaryBorderColor}`,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  return (
    <Html>
      <Head>
        <title>Подтверждение заказа #{orderNumber} - OnlyPC</title>
      </Head>
      <Preview>Подтверждение заказа #{orderNumber} - OnlyPC</Preview>
      <Body
        style={{
          backgroundColor: primaryDarkColor,
          margin: "0",
          padding: "0",
          fontFamily: "'Montserrat Alternates', Arial, sans-serif",
          color: "#FFFFFF",
        }}
      >
        {/* Контейнер письма */}
        <Container
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "48px 0",
            width: "100%",
          }}
        >
          {/* Верхний блок */}
          <Section style={sectionStyle}>
            {/* Верхняя полоса как отдельная таблица для лучшей совместимости */}
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{ borderCollapse: "collapse" }}
            >
              <tr>
                <td
                  style={{
                    height: "6px",
                    background: `linear-gradient(to right, ${highlightColor}, ${accentColor}, ${highlightColor})`,
                    opacity: "0.8",
                  }}
                ></td>
              </tr>
            </table>

            {/* Содержимое секции с отступами */}
            <div style={sectionContentStyle}>
              <Row>
                <Column>
                  <div
                    style={{
                      display: "table",
                      width: "100%",
                      marginBottom: "32px",
                    }}
                  >
                    <div
                      style={{
                        display: "table-cell",
                        verticalAlign: "middle",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                        // style={{
                        //   width: "64px",
                        //   height: "64px",
                        //   backgroundColor: primaryColor,
                        //   borderRadius: "12px",
                        //   padding: "12px",
                        //   border: `1px solid ${primaryBorderColor}`,
                        //   display: "inline-block",
                        //   boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        // }}
                        >
                          <Img
                            src="/logo.svg"
                            alt="OnlyPC Logo"
                            width="40"
                            height="40"
                            style={{
                              display: "block",
                              width: "80%",
                              height: "auto",
                              maxWidth: "80%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "table-cell",
                        verticalAlign: "middle",
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 20px",
                          backgroundColor: primaryColor,
                          borderRadius: "12px",
                          border: `1px solid ${primaryBorderColor}`,
                          display: "inline-block",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Text
                          style={{
                            color: accentLightColor,
                            fontSize: "16px",
                            fontWeight: "500",
                            margin: "0",
                          }}
                        >
                          Заказ #{orderNumber}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: "28px",
                      fontWeight: "700",
                      margin: "0 0 16px 0",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    Заказ подтвержден
                  </Text>
                  <Text
                    style={{
                      color: secondaryLightColor,
                      fontSize: "18px",
                      lineHeight: "1.5",
                      margin: "0",
                    }}
                  >
                    Здравствуйте, {customerName}! <br />
                    Благодарим за ваш заказ от {orderDate}.
                  </Text>
                </Column>
              </Row>
            </div>
          </Section>

          {/* Блок с информацией о заказе */}
          <Section style={sectionStyle}>
            {/* Верхняя полоса как отдельная таблица для лучшей совместимости */}
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{ borderCollapse: "collapse" }}
            >
              <tr>
                <td
                  style={{
                    height: "6px",
                    background: `linear-gradient(to right, ${highlightColor}, ${accentColor}, ${highlightColor})`,
                    opacity: "0.8",
                  }}
                ></td>
              </tr>
            </table>

            {/* Содержимое секции с отступами */}
            <div style={sectionContentStyle}>
              <Row>
                <Column>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: "24px",
                      fontWeight: "700",
                      margin: "0 0 32px 0",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    Состав заказа
                  </Text>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        marginBottom: "20px",
                        padding: "20px",
                        backgroundColor: primaryColor,
                        borderRadius: "12px",
                        border: `1px solid ${primaryBorderColor}`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: "18px",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {item.name}
                      </Text>
                      <div
                        style={{
                          marginTop: "12px",
                        }}
                      >
                        <table
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tr>
                            <td>
                              <Text
                                style={{
                                  color: secondaryLightColor,
                                  fontSize: "16px",
                                  margin: "0",
                                }}
                              >
                                {formatCurrency(item.price)} × {item.quantity}{" "}
                                шт.
                              </Text>
                            </td>
                            <td align="right">
                              <Text
                                style={{
                                  color: accentLightColor,
                                  fontSize: "18px",
                                  fontWeight: "600",
                                  margin: "0",
                                }}
                              >
                                {formatCurrency(item.price * item.quantity)}
                              </Text>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </div>
                  ))}

                  <Hr
                    style={{
                      borderTop: `2px solid ${primaryBorderColor}`,
                      borderBottom: "none",
                      margin: "32px 0",
                    }}
                  />

                  <div style={{ padding: "0 8px" }}>
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <tr>
                        <td style={{ padding: "8px 0" }}>
                          <Text
                            style={{
                              color: secondaryLightColor,
                              fontSize: "16px",
                              margin: "0",
                            }}
                          >
                            Стоимость товаров:
                          </Text>
                        </td>
                        <td align="right" style={{ padding: "8px 0" }}>
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: "18px",
                              fontWeight: "500",
                              margin: "0",
                            }}
                          >
                            {formatCurrency(subtotal)}
                          </Text>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0" }}>
                          <Text
                            style={{
                              color: secondaryLightColor,
                              fontSize: "16px",
                              margin: "0",
                            }}
                          >
                            Стоимость доставки:
                          </Text>
                        </td>
                        <td align="right" style={{ padding: "8px 0" }}>
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: "18px",
                              fontWeight: "500",
                              margin: "0",
                            }}
                          >
                            {formatCurrency(deliveryPrice)}
                          </Text>
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            borderTop: `2px solid ${primaryBorderColor}`,
                            paddingTop: "24px",
                            paddingBottom: "8px",
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: "20px",
                              fontWeight: "700",
                              margin: "0",
                            }}
                          >
                            Итого к оплате:
                          </Text>
                        </td>
                        <td
                          align="right"
                          style={{
                            borderTop: `2px solid ${primaryBorderColor}`,
                            paddingTop: "24px",
                            paddingBottom: "8px",
                          }}
                        >
                          <Text
                            style={{
                              color: highlightColor,
                              fontSize: "28px",
                              fontWeight: "700",
                              margin: "0",
                              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                          >
                            {formatCurrency(totalPrice)}
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </div>
                </Column>
              </Row>
            </div>
          </Section>

          {/* Блок с информацией о доставке и оплате */}
          <Section style={sectionStyle}>
            {/* Верхняя полоса как отдельная таблица для лучшей совместимости */}
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{ borderCollapse: "collapse" }}
            >
              <tr>
                <td
                  style={{
                    height: "6px",
                    background: `linear-gradient(to right, ${highlightColor}, ${accentColor}, ${highlightColor})`,
                    opacity: "0.8",
                  }}
                ></td>
              </tr>
            </table>

            {/* Содержимое секции с отступами */}
            <div style={sectionContentStyle}>
              <Row>
                <Column style={{ width: "50%", paddingRight: "16px" }}>
                  <div
                    style={{
                      padding: "24px",
                      backgroundColor: primaryColor,
                      borderRadius: "12px",
                      border: `1px solid ${primaryBorderColor}`,
                      minHeight: "150px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: "20px",
                        fontWeight: "700",
                        margin: "0 0 16px 0",
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      Информация о доставке
                    </Text>
                    <Text
                      style={{
                        color: accentLightColor,
                        fontSize: "18px",
                        margin: "0 0 8px 0",
                        fontWeight: "500",
                      }}
                    >
                      {deliveryMethod}
                    </Text>
                    <Text
                      style={{
                        color: secondaryLightColor,
                        fontSize: "16px",
                        margin: "0",
                      }}
                    >
                      {deliveryAddress}
                    </Text>
                  </div>
                </Column>
                <Column style={{ width: "50%", paddingLeft: "16px" }}>
                  <div
                    style={{
                      padding: "24px",
                      backgroundColor: primaryColor,
                      borderRadius: "12px",
                      border: `1px solid ${primaryBorderColor}`,
                      minHeight: "150px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: "20px",
                        fontWeight: "700",
                        margin: "0 0 16px 0",
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      Способ оплаты
                    </Text>
                    <Text
                      style={{
                        color: accentLightColor,
                        fontSize: "18px",
                        margin: "0",
                        fontWeight: "500",
                      }}
                    >
                      {paymentMethod}
                    </Text>
                  </div>
                </Column>
              </Row>
            </div>
          </Section>

          {/* Дополнительная информация и контакты */}
          <Section
            style={{
              textAlign: "center",
              marginTop: "40px",
              padding: "24px",
              backgroundColor: gradientFromColor,
              backgroundImage: `linear-gradient(145deg, ${gradientFromColor}, ${gradientToColor})`,
              borderRadius: "16px",
              border: `2px solid ${primaryBorderColor}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <Text
              style={{
                color: secondaryLightColor,
                fontSize: "18px",
                margin: "0 0 16px 0",
              }}
            >
              Если у вас возникли вопросы по заказу, свяжитесь с нами:
            </Text>
            <Link
              href="mailto:support@only-pc.ru"
              style={{
                color: accentLightColor,
                fontSize: "20px",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              support@only-pc.ru
            </Link>
            <Text
              style={{
                color: secondaryDarkColor,
                fontSize: "16px",
                margin: "40px 0 0 0",
              }}
            >
              © {new Date().getFullYear()} OnlyPC. Все права защищены.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;
