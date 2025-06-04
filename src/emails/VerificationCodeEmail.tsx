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

interface VerificationCodeEmailProps {
  code: string;
}

export const VerificationCodeEmail = ({ code }: VerificationCodeEmailProps) => {
  const primaryColor = "#131421";
  const primaryDarkColor = "#0D0E19";
  const primaryBorderColor = "#343656";
  const secondaryColor = "#AEB0BD";
  const secondaryDarkColor = "#7E808F";
  const secondaryLightColor = "#E0E0E9";
  const gradientFromColor = "#212235";
  const gradientToColor = "#282A3D";
  const accentColor = "#4F92FF";
  const accentLightColor = "#75A8FF";
  const highlightColor = "#9D6FFF";

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

  // Стиль для содержимого секции с паддингами
  const sectionContentStyle = {
    padding: "32px",
  };

  return (
    <Html>
      <Head>
        <title>Код подтверждения входа в OnlyPC</title>
      </Head>
      <Preview>Ваш код подтверждения для входа в OnlyPC: {code}</Preview>
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
                  {" "}
                  <div
                    style={{
                      width: "100%",
                      marginBottom: "32px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        backgroundColor: primaryColor,
                        borderRadius: "16px",
                        padding: "16px",
                        border: `1px solid ${primaryBorderColor}`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Img
                        src="https://only-pc.ru/logo.svg"
                        alt="OnlyPC Logo"
                        style={{
                          display: "block",
                          margin: "0 auto",
                          width: "auto",
                          height: "auto",
                          maxWidth: "70%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: "28px",
                      fontWeight: "700",
                      margin: "0 0 16px 0",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      textAlign: "center",
                    }}
                  >
                    Подтверждение входа
                  </Text>
                  <Text
                    style={{
                      color: secondaryLightColor,
                      fontSize: "18px",
                      lineHeight: "1.5",
                      margin: "0 0 32px 0",
                      textAlign: "center",
                    }}
                  >
                    Для входа в аккаунт введите следующий код подтверждения:
                  </Text>
                  {/* Блок с кодом */}
                  <div
                    style={{
                      backgroundColor: primaryColor,
                      borderRadius: "12px",
                      padding: "24px",
                      textAlign: "center",
                      border: `1px solid ${primaryBorderColor}`,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      margin: "0 auto 32px auto",
                      maxWidth: "400px",
                    }}
                  >
                    <Text
                      style={{
                        color: highlightColor,
                        fontSize: "36px",
                        fontWeight: "700",
                        margin: "0",
                        letterSpacing: "8px",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      {code}
                    </Text>
                  </div>
                  <Text
                    style={{
                      color: secondaryColor,
                      fontSize: "16px",
                      margin: "0",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    Код действителен в течение 5 минут
                  </Text>
                </Column>
              </Row>
            </div>
          </Section>

          {/* Дополнительная информация и контакты */}
          <Section
            style={{
              textAlign: "center",
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
                fontSize: "16px",
                margin: "0 0 16px 0",
              }}
            >
              Если вы не запрашивали этот код, просто проигнорируйте данное
              письмо.
            </Text>

            <Text
              style={{
                color: secondaryLightColor,
                fontSize: "16px",
                margin: "0 0 24px 0",
              }}
            >
              Если у вас возникли вопросы, свяжитесь с нами:
            </Text>

            <Link
              href="mailto:support@only-pc.ru"
              style={{
                color: accentLightColor,
                fontSize: "18px",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              support@only-pc.ru
            </Link>

            <Text
              style={{
                color: secondaryDarkColor,
                fontSize: "14px",
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

export default VerificationCodeEmail;
