import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfiguratorProvider } from "@/contexts/ConfiguratorContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { CartProvider } from "@/contexts/CartContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { ModalProvider } from "@/contexts/ModalContext";
import LoadingState from "@/components/common/LoadingState";
import CookieConsent from "@/components/common/CookieConsent/CookieConsent";
import "@fontsource/montserrat-alternates";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "OnlyPC",
  description: "OnlyPC - Конфигуратор ПК",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-primary-dark" suppressHydrationWarning>
        {" "}
        <AuthProvider>
          <LoadingState>
            <FavoritesProvider>
              <CartProvider>
                <CheckoutProvider>
                  <ConfiguratorProvider>
                    <ModalProvider>
                      <ClientLayout>{children}</ClientLayout>
                      <CookieConsent />
                    </ModalProvider>
                  </ConfiguratorProvider>
                </CheckoutProvider>
              </CartProvider>
            </FavoritesProvider>
          </LoadingState>
        </AuthProvider>
      </body>
    </html>
  );
}
