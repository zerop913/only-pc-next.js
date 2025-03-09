import { motion } from "framer-motion";
import Navigation from "./Navigation";
import SearchBar from "./SearchBar";
import UserActions from "./UserActions";
import {
  XMarkIcon,
  HeartIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  FolderIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  onClick?: () => void;
}

const QuickAction = ({
  icon: Icon,
  label,
  count,
  onClick,
}: QuickActionProps) => (
  <motion.button
    variants={{
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    }}
    className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-from/20 border border-primary-border relative"
    onClick={onClick}
  >
    <Icon className="w-6 h-6 text-secondary-light mb-2" />
    <span className="text-xs text-secondary-light">{label}</span>
    {count !== undefined && (
      <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 rounded-full text-xs text-white">
        {count}
      </span>
    )}
  </motion.button>
);

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const router = useRouter();
  const { isAuthenticated, user, logout, isInitialized } = useAuth();

  // Оптимизированные варианты анимации
  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2, // Ускорили анимацию
        when: "beforeChildren",
        staggerChildren: 0.05, // Уменьшили задержку между элементами
      },
    },
  };

  // Уменьшаем сложность анимации контейнера
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "tween", // Заменили spring на tween для более быстрой анимации
        duration: 0.15, // Быстрее
      },
    },
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      router.push("/profile");
      onClose();
    } else {
      router.push("/login");
      onClose();
    }
  };

  const handleLogoutClick = () => {
    logout();
    onClose();
  };

  const handleConfiguratorClick = () => {
    router.push("/configurator");
    onClose();
  };

  const handleCatalogClick = () => {
    router.push("/catalog");
    onClose();
  };

  // Если данные о статусе авторизации не загружены, откладываем рендеринг меню
  if (!isInitialized) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-30 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ willChange: "opacity" }} // Оптимизация производительности
    >
      {/* Используем обычный div вместо motion.div для фона */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        style={{
          opacity: isOpen ? 1 : 0,
          transitionProperty: "opacity",
          transitionTimingFunction: "ease",
        }}
      />

      <div
        className="absolute top-[72px] left-0 right-0 bottom-0 bg-primary overflow-y-auto transition-all duration-200"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: `translateY(${isOpen ? 0 : 10}px)`,
          transitionProperty: "opacity, transform",
          transitionTimingFunction: "ease",
        }}
      >
        {/* Основной контент */}
        <div className="flex flex-col min-h-full">
          {/* Поиск */}
          <div className="p-4 border-b border-primary-border">
            <SearchBar isMobile className="w-full" />
          </div>

          {/* Быстрые действия */}
          <div className="grid grid-cols-3 gap-3 p-4 border-b border-primary-border">
            <QuickAction icon={HeartIcon} label="Избранное" count={2} />
            <QuickAction icon={ShoppingCartIcon} label="Корзина" count={1} />
            <QuickAction
              icon={UserIcon}
              label={
                isAuthenticated
                  ? user?.email?.split("@")[0] || "Профиль"
                  : "Войти"
              }
              onClick={handleProfileClick}
            />
          </div>

          {/* Основная навигация */}
          <div className="p-4 space-y-4">
            {/* Конфигуратор */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#2A2D3E] to-[#353849] border border-primary-border">
              <div className="flex items-center gap-3 mb-3">
                <CogIcon className="w-6 h-6 text-white" />
                <h3 className="text-white font-medium">Конфигуратор</h3>
              </div>
              <p className="text-sm text-secondary-light mb-4">
                Соберите свой идеальный компьютер с помощью нашего конфигуратора
              </p>
              <button
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium"
                onClick={handleConfiguratorClick}
              >
                Начать сборку
              </button>
            </div>

            {/* Каталог */}
            <div className="p-4 rounded-xl bg-gradient-from/20 border border-primary-border">
              <div className="flex items-center gap-3 mb-3">
                <FolderIcon className="w-6 h-6 text-white" />
                <h3 className="text-white font-medium">Каталог</h3>
              </div>
              <p className="text-sm text-secondary-light mb-4">
                Просмотрите наш каталог готовых сборок
              </p>
              <button
                className="w-full py-3 rounded-lg bg-gradient-from/30 text-white text-sm font-medium border border-primary-border"
                onClick={handleCatalogClick}
              >
                Перейти в каталог
              </button>
            </div>
          </div>

          {/* Футер с кнопкой выхода */}
          <div className="mt-auto bg-gradient-from/10 border-t border-primary-border">
            {isAuthenticated && (
              <div className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-light text-sm">
                    © 2025 OnlyPC
                  </span>
                  <button
                    onClick={handleLogoutClick}
                    className="text-secondary-light hover:text-white flex items-center text-xs gap-1 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            )}
            {!isAuthenticated && (
              <div className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-light">© 2025 OnlyPC</span>
                  <span className="text-secondary-light">Версия 1.0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
