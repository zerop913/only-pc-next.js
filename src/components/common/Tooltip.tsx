"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 0,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyles, setTooltipStyles] = useState({});
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let left = 0;
    let top = 0;
    let origin = "";

    // Рассчитываем позицию относительно viewport
    switch (position) {
      case "top":
        left = childRect.left + (childRect.width - tooltipRect.width) / 2;
        top = childRect.top - tooltipRect.height - 8;
        origin = "bottom";
        break;
      case "bottom":
        left = childRect.left + (childRect.width - tooltipRect.width) / 2;
        top = childRect.bottom + 8;
        origin = "top";
        break;
      case "left":
        left = childRect.left - tooltipRect.width - 8;
        top = childRect.top + (childRect.height - tooltipRect.height) / 2;
        origin = "right";
        break;
      case "right":
        left = childRect.right + 8;
        top = childRect.top + (childRect.height - tooltipRect.height) / 2;
        origin = "left";
        break;
    }

    // Обеспечиваем, чтобы тултип не выходил за границы экрана
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > viewportHeight - 10) {
      top = viewportHeight - tooltipRect.height - 10;
    }

    setTooltipStyles({
      left: `${left}px`,
      top: `${top}px`,
      transformOrigin: origin,
    });
  };

  // Обработчики событий для отображения и скрытия тултипа
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Обновляем позицию тултипа при изменении размеров окна
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition);
    }

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [content, isVisible]);

  return (
    <div
      className={`inline-block relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={childRef}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className="fixed z-[9999] whitespace-normal pointer-events-none"
            style={tooltipStyles}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 py-2 text-xs font-medium rounded-md shadow-lg text-white bg-gray-800/90 max-w-xs">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
