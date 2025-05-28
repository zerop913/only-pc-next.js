"use client";

import React, { useState } from "react";
import { sendOrderConfirmationEmail } from "@/services/orderEmailService";
import { Mail, Check, Loader2 } from "lucide-react";

interface SendOrderEmailButtonProps {
  orderId: number;
}

export default function SendOrderEmailButton({
  orderId,
}: SendOrderEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async () => {
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const success = await sendOrderConfirmationEmail(orderId);

      if (success) {
        setIsSent(true);
        setTimeout(() => setIsSent(false), 5000); // Сбрасываем индикатор успеха через 5 секунд
      } else {
        setError("Не удалось отправить письмо");
      }
    } catch (err) {
      console.error("Ошибка отправки письма:", err);
      setError("Произошла ошибка при отправке письма");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSendEmail}
        disabled={isSending}
        className={`text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
          isSent
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        } ${isSending ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSent ? (
          <Check className="h-4 w-4" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isSent ? "Письмо отправлено" : "Отправить письмо"}
      </button>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
