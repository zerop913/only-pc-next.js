"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";
import Navigation from "./Navigation";
import SearchBar from "./SearchBar";
import UserActions from "./UserActions";
import MobileMenu from "./MobileMenu";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import LoadingState from "@/components/common/LoadingState";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Используем контекст авторизации
  const { isLoading, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (mounted && isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, mounted]);

  // Функция для мгновенного открытия/закрытия меню без задержки
  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Скрываем плейсхолдер для действий пользователя, пока идет загрузка
  const showUserActions = mounted && isInitialized;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 bg-primary h-[72px] py-4 px-4 
        sm:px-6 border-b border-primary-border z-40"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Logo />
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Navigation isTablet={isTablet} />
            </div>
          </div>
          <div className="hidden md:flex items-center divide-x divide-primary-border">
            <div className="px-6">
              <SearchBar isTablet={isTablet} />
            </div>
            <div className="px-6">
              {showUserActions ? (
                <UserActions isMobile={false} isTablet={isTablet} />
              ) : (
                <div className="h-10 flex items-center justify-center">
                  <div className="w-16 h-4 bg-primary-border/50 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          <button
            className="md:hidden flex items-center justify-center"
            onClick={toggleMenu}
            aria-label="Открыть меню"
          >
            <Bars3Icon className="w-6 h-6 text-secondary-light hover:text-white transition-colors duration-200" />
          </button>
        </div>
      </header>
      <div className="h-[72px]" />
      {/* Предварительная загрузка меню, но скрываем его */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
