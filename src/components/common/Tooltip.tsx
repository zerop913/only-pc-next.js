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

  // Рассчитать позицию тултипа относительно родительского элемента
  const calculatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;
    let origin = "";

    switch (position) {
      case "top":
        x = (childRect.width - tooltipRect.width) / 2;
        y = -tooltipRect.height - 8;
        origin = "bottom";
        break;
      case "bottom":
        x = (childRect.width - tooltipRect.width) / 2;
        y = childRect.height + 8;
        origin = "top";
        break;
      case "left":
        x = -tooltipRect.width - 8;
        y = (childRect.height - tooltipRect.height) / 2;
        origin = "right";
        break;
      case "right":
        x = childRect.width + 8;
        y = (childRect.height - tooltipRect.height) / 2;
        origin = "left";
        break;
    }

    // Обеспечиваем, чтобы тултип не выходил за границы экрана
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipLeft = childRect.left + x;
    const tooltipRight = tooltipLeft + tooltipRect.width;
    const tooltipTop = childRect.top + y;
    const tooltipBottom = tooltipTop + tooltipRect.height;

    if (tooltipLeft < 0) {
      x -= tooltipLeft - 10;
    } else if (tooltipRight > viewportWidth) {
      x -= tooltipRight - viewportWidth + 10;
    }

    if (tooltipTop < 0) {
      y -= tooltipTop - 10;
    } else if (tooltipBottom > viewportHeight) {
      y -= tooltipBottom - viewportHeight + 10;
    }

    setTooltipStyles({
      left: `${x}px`,
      top: `${y}px`,
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
            className="absolute z-50 whitespace-normal"
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
