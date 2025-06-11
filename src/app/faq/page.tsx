import FAQPage from "@/components/pages/FAQ/FAQPage";
import { Metadata } from "next";
import { PAGE_TITLES } from "@/config/pageTitles";

export const metadata: Metadata = {
  title: PAGE_TITLES.FAQ,
  description:
    "Часто задаваемые вопросы о конфигураторе ПК, доставке, гарантии и технической поддержке.",
};

export default function Page() {
  return <FAQPage />;
}
