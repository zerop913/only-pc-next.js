"use client";

import { InfoIcon } from "lucide-react";
import Checkbox from "@/components/common/ui/Checkbox";
import { useCookie } from "@/contexts/CookieContext";

interface CookieSettingsProps {
  onOpenInfoModal: () => void;
}

export default function CookieSettings({
  onOpenInfoModal,
}: CookieSettingsProps) {
  const { settings, updateSettings } = useCookie();

  const handleFunctionalCookiesChange = (checked: boolean) => {
    updateSettings({ functional: checked });
  };

  const handleAnalyticalCookiesChange = (checked: boolean) => {
    updateSettings({ analytical: checked });
  };
  return (
    <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6 shadow-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-white">
          Настройки файлов cookie
        </h2>
        <button
          onClick={onOpenInfoModal}
          className="group p-2 hover:bg-blue-500/10 rounded-full transition-colors duration-200"
          title="Подробнее о cookie"
        >
          <InfoIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 pl-3 pr-2 bg-gradient-from/5 rounded-lg border border-primary-border/30">
            <div className="flex-1">
              <h3 className="text-white text-sm font-medium">
                Необходимые cookies
              </h3>
              <p className="text-secondary-light text-xs mt-1">
                Обеспечивают базовую функциональность сайта
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-secondary-light mr-3">
                Всегда активны
              </span>
              <Checkbox checked={true} onChange={() => {}} />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 pl-3 pr-2 bg-gradient-from/5 rounded-lg border border-primary-border/30">
            <div className="flex-1">
              <h3 className="text-white text-sm font-medium">
                Функциональные cookies
              </h3>
              <p className="text-secondary-light text-xs mt-1">
                Запоминают ваши предпочтения и настройки
              </p>
            </div>
            <Checkbox
              checked={settings.functional}
              onChange={handleFunctionalCookiesChange}
            />
          </div>

          <div className="flex items-center justify-between py-2 pl-3 pr-2 bg-gradient-from/5 rounded-lg border border-primary-border/30">
            <div className="flex-1">
              <h3 className="text-white text-sm font-medium">
                Аналитические cookies
              </h3>
              <p className="text-secondary-light text-xs mt-1">
                Помогают улучшать работу сайта
              </p>
            </div>
            <Checkbox
              checked={settings.analytical}
              onChange={handleAnalyticalCookiesChange}
            />
          </div>
        </div>

        <div className="text-xs text-secondary-light">
          <p>
            Необходимые cookies всегда активны и требуются для корректного
            функционирования сайта. Отключение других типов cookies может
            ограничить некоторые функции сайта.
          </p>
        </div>
      </div>
    </div>
  );
}
