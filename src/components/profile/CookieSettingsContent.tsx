"use client";

import { useModal } from "@/contexts/ModalContext";
import ProfileCookieSettings from "./ProfileCookieSettings";

export default function CookieSettingsContent() {
  const modal = useModal();

  return (
    <ProfileCookieSettings
      onOpenInfoModal={() => modal.openCookieInfoModal()}
    />
  );
}
