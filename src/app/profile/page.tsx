import ProfilePage from "@/components/profile/ProfilePage";
import { Metadata } from "next";
import { PAGE_TITLES } from "@/config/pageTitles";

export const metadata: Metadata = {
  title: PAGE_TITLES.PROFILE,
  description:
    "Личный кабинет пользователя - управление профилем, история заказов, настройки аккаунта.",
};

export default function ConfiguratorPage() {
  return <ProfilePage />;
}
