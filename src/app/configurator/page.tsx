import Categories from "@/components/configurator/categories/Categories";
import { Metadata } from "next";
import { PAGE_TITLES } from "@/config/pageTitles";

export const metadata: Metadata = {
  title: PAGE_TITLES.CONFIGURATOR,
  description:
    "Интерактивный конфигуратор ПК поможет собрать компьютер под ваши задачи и бюджет. Проверка совместимости, расчет производительности.",
};

export default function ConfiguratorPage() {
  return <Categories />;
}
