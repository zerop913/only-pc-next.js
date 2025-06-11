"use client";

import { useEffect } from "react";
import PrivacyPage from "@/components/pages/Privacy/PrivacyPage";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function Page() {
  useEffect(() => {
    document.title = PAGE_TITLES.PRIVACY;
  }, []);

  return <PrivacyPage />;
}
