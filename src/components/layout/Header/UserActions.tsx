import {
  HeartIcon,
  ShoppingCartIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/common/Button/Button";
import { ElementType } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
// import CartBadge from "@/components/pages/Cart/CartBadge";

interface ActionButtonProps {
  icon: ElementType;
  label: string;
  isMobile?: boolean;
  isTablet?: boolean;
  onClick?: () => void;
}

const ActionButton = ({
  icon: Icon,
  label,
  isMobile,
  isTablet,
  onClick,
}: ActionButtonProps) => {
  if (isMobile) {
    return (
      <Button icon={Icon} onClick={onClick}>
        {label}
      </Button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-[#7D7D7D] hover:text-white 
          transition-colors duration-200 ${isTablet ? "px-1" : ""}`}
    >
      <Icon className={`w-5 h-5 mb-1 ${isTablet ? "md:w-4 md:h-4" : ""}`} />
      <span className={`text-xs ${isTablet ? "hidden lg:inline" : ""}`}>
        {label}
      </span>
    </button>
  );
};

interface UserActionsProps {
  isMobile?: boolean;
  isTablet?: boolean;
}

const UserActions = ({ isMobile, isTablet }: UserActionsProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getItemsCount } = useCart();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Обработчики нажатия на кнопки
  const handleAuthClick = () => {
    if (isAuthenticated) {
      router.push("/profile");
    } else {
      router.push("/login");
    }
  };

  const handleLogoutClick = () => {
    if (isMobile) {
      // На мобильных устройствах сразу выходим
      logout();
    } else {
      // На десктопе показываем подтверждение
      setShowLogoutConfirm(true);
    }
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };
  const handleFavoritesClick = () => {
    router.push("/favorites");
  };

  const handleCartClick = () => {
    router.push("/cart");
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch("/api/profile", {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.profile);
          }
        } catch (error) {
          console.error("Ошибка получения профиля:", error);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, user]);

  // Определяем отображаемое имя пользователя с учетом приоритета
  const displayName = userProfile?.firstName
    ? userProfile.firstName
    : user?.email?.split("@")[0] || "Профиль";

  if (!isMobile && isAuthenticated) {
    return (
      <div className="relative flex space-x-6">
        <ActionButton
          icon={HeartIcon}
          label="Избранное"
          isTablet={isTablet}
          onClick={handleFavoritesClick}
        />{" "}
        <div className="relative">
          <ActionButton
            icon={ShoppingCartIcon}
            label="Корзина"
            isTablet={isTablet}
            onClick={handleCartClick}
          />
          {/* <CartBadge size="sm" /> */}
        </div>
        {/* Профиль с выпадающим меню */}
        <div className="relative">
          <ActionButton
            icon={UserIcon}
            label={displayName}
            isTablet={isTablet}
            onClick={handleAuthClick}
          />

          {/* Выпадающее меню с кнопкой выхода */}
          {showLogoutConfirm && (
            <div className="absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg bg-primary-dark border border-primary-border overflow-hidden z-50">
              <div className="py-1">
                <button
                  onClick={confirmLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-primary-border"
                >
                  Выйти из аккаунта
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="block w-full text-left px-4 py-2 text-sm text-secondary-light hover:bg-primary-border"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        isMobile
          ? "flex-col space-y-2"
          : `space-x-2 ${isTablet ? "md:space-x-1" : ""} lg:space-x-6`
      }`}
    >
      <ActionButton
        icon={HeartIcon}
        label="Избранное"
        isMobile={isMobile}
        isTablet={isTablet}
        onClick={handleFavoritesClick}
      />{" "}
      <div className="relative">
        <ActionButton
          icon={ShoppingCartIcon}
          label="Корзина"
          isMobile={isMobile}
          isTablet={isTablet}
          onClick={handleCartClick}
        />
        {/* <CartBadge size={isMobile ? "md" : "sm"} /> */}
      </div>
      <ActionButton
        icon={isAuthenticated ? UserIcon : ArrowRightOnRectangleIcon}
        label={isAuthenticated ? displayName : "Войти"}
        isMobile={isMobile}
        isTablet={isTablet}
        onClick={handleAuthClick}
      />
      {isAuthenticated && isMobile && (
        <ActionButton
          icon={ArrowRightOnRectangleIcon}
          label="Выйти"
          isMobile={isMobile}
          isTablet={isTablet}
          onClick={handleLogoutClick}
        />
      )}
    </div>
  );
};

export default UserActions;
