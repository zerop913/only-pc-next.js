import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-primary-dark flex items-center justify-center">
      <div className="w-full  bg-gradient-from/20 rounded-xl">{children}</div>
    </div>
  );
}
