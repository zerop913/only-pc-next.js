"use client";

import { useEffect } from "react";
import TermsPage from "@/components/pages/Terms/TermsPage";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function Page() {
  useEffect(() => {
    document.title = PAGE_TITLES.TERMS;
  }, []);

  return <TermsPage />;
}
