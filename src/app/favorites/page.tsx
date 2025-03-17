"use client";

import { useState, useEffect } from "react";
import FavoritesPage from "@/components/favorites/FavoritesPage";

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <FavoritesPage />;
}
