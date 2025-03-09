import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import "@fontsource/montserrat-alternates";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "OnlyPC",
  description: "OnlyPC - Конфигуратор ПК",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-primary-dark" suppressHydrationWarning>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
