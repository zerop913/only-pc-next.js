"use client";

import React, { useState } from "react";
import { getOrderEmailPreviewUrl } from "@/services/orderEmailService";

export default function OrderEmailPreviewPage() {
  const [orderId, setOrderId] = useState<number | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputValue);
    if (!isNaN(id)) {
      setOrderId(id);
    }
  };

  // URL для предпросмотра письма
  const previewUrl = getOrderEmailPreviewUrl(orderId);

  return (
    <div className="min-h-screen bg-primary-dark p-4">
      <div className="max-w-screen-lg mx-auto bg-primary rounded-lg shadow-lg overflow-hidden border border-primary-border">
        <div className="p-4 bg-gradient-from border-b border-primary-border">
          <h1 className="text-xl text-white font-bold">
            Предпросмотр письма подтверждения заказа
          </h1>
          <p className="text-secondary mt-2">
            Этот инструмент позволяет просмотреть, как будет выглядеть письмо с
            подтверждением заказа. По умолчанию показан пример письма с
            тестовыми данными.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Введите ID заказа"
              className="flex-grow p-2 rounded-md bg-[#1A1B23] border border-primary-border text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Загрузить
            </button>
            {orderId && (
              <button
                type="button"
                onClick={() => {
                  setOrderId(undefined);
                  setInputValue("");
                }}
                className="bg-[#22243A] hover:bg-[#2A2C44] text-white px-4 py-2 rounded-md transition-colors"
              >
                Сбросить
              </button>
            )}
          </form>
        </div>

        <div className="w-full h-[700px]">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Предпросмотр письма подтверждения заказа"
          />
        </div>
      </div>
    </div>
  );
}
