"use client";

import { useEffect } from "react";
import FavoritesPage from "@/components/favorites/FavoritesPage";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function Page() {
  useEffect(() => {
    document.title = PAGE_TITLES.FAVORITES;
  }, []);

  return <FavoritesPage />;
}
