import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  linkText?: string;
  linkHref?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  linkText,
  linkHref,
}) => {
  return (
    <div className="fixed inset-0 bg-primary-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl bg-gradient-from/20 rounded-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>

        {/* Мобильная версия */}
        <div className="block lg:hidden space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {title}
            </h2>
            <div className="space-y-2 max-w-md mx-auto">
              <div className="h-0.5 w-16 bg-blue-500/30 mx-auto"></div>
              <p className="text-secondary-light text-sm sm:text-base">
                Создайте свою идеальную конфигурацию
              </p>
              <p className="text-secondary-light text-sm sm:text-base">
                Быстрый и удобный подбор комплектующих
              </p>
            </div>
          </div>
          {children}
        </div>

        {/* Десктопная версия */}
        <div className="hidden lg:grid grid-cols-2 gap-12 relative">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col justify-center space-y-6 z-10">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              {title}
            </h2>
            <div className="space-y-3 opacity-70">
              <div className="h-0.5 w-16 bg-blue-500/30 mb-3"></div>
              <p className="text-secondary-light text-base">
                Создайте свою идеальную конфигурацию
              </p>
              <p className="text-secondary-light text-base">
                Быстрый и удобный подбор комплектующих
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center z-10">{children}</div>
        </div>

        {linkText && linkHref && (
          <div className="mt-8 lg:mt-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="hidden sm:block h-px w-12 bg-secondary-light/30"></div>
              <Link
                href={linkHref}
                className="text-sm text-white hover:text-gray-300 transition-colors 
                  bg-gradient-from/10 px-4 py-2 rounded-lg 
                  border border-primary-border
                  flex items-center gap-2 group"
              >
                <span>{linkText}</span>
                <motion.div
                  initial={{ x: -5, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  →
                </motion.div>
              </Link>
              <div className="hidden sm:block h-px w-12 bg-secondary-light/30"></div>
            </motion.div>
          </div>
        )}

        <div className="mt-6 text-center text-[10px] sm:text-xs text-secondary-light/50 px-4">
          Этот сайт защищен reCAPTCHA и применяются
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 ml-1"
          >
            Политика конфиденциальности
          </a>{" "}
          и
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 ml-1"
          >
            Условия использования
          </a>{" "}
          Google.
        </div>
      </motion.div>
    </div>
  );
};
