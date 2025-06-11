import MainPage from "@/components/pages/Main/MainPage";
import { Metadata } from "next";
import { PAGE_TITLES } from "@/config/pageTitles";

export const metadata: Metadata = {
  title: PAGE_TITLES.HOME,
  description: "Создайте идеальную сборку ПК с нашим конфигуратором или выберите готовую конфигурацию. Качественные комплектующие, выгодные цены, быстрая доставка."
};

export default function Home() {
  return <MainPage />;
}
