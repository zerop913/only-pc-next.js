"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrderEmailPreviewUrl } from "@/services/orderEmailService";
import Link from "next/link";

export default function AdminOrderEmailPreviewLink({
  orderId,
}: {
  orderId: number;
}) {
  const previewUrl = getOrderEmailPreviewUrl(orderId);

  return (
    <Link
      href={`/email-preview?orderId=${orderId}`}
      className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
      target="_blank"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      Предпросмотр письма
    </Link>
  );
}
