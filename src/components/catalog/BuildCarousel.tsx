import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CircularProgressBar } from "./CircularProgressBar";
import { Package } from "lucide-react";

interface ComponentImage {
  image: string | null;
  categoryName: string;
  categoryIcon?: string;
  title: string;
}

interface BuildCarouselProps {
  images: ComponentImage[];
  autoplayInterval?: number;
  isLoading?: boolean;
}

const BuildCarousel: React.FC<BuildCarouselProps> = ({
  images,
  autoplayInterval = 3000,
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let animationFrame: number;
    let lastTimestamp: number;

    const updateProgress = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      const progressStep = (elapsed / autoplayInterval) * 100;

      setProgress((prevProgress) => {
        const newProgress = prevProgress + progressStep;
        return newProgress > 100 ? 100 : newProgress;
      });

      lastTimestamp = timestamp;

      if (isPlaying && !isHovered) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    if (images.length > 1 && isPlaying && !isHovered) {
      setProgress(0);
      lastTimestamp = performance.now();
      animationFrame = requestAnimationFrame(updateProgress);

      interval = setInterval(() => {
        if (!isHovered) {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
          setProgress(0);
          lastTimestamp = performance.now();
        }
      }, autoplayInterval);
    }

    return () => {
      clearInterval(interval);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [currentIndex, isPlaying, isHovered, images.length, autoplayInterval]);

  const handlePause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
    setProgress(0);
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="aspect-[16/10] bg-gradient-from/10 rounded-t-lg animate-pulse flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary-border border-t-blue-400 animate-spin"></div>
      </div>
    );
  }

  // Пустое состояние, когда нет изображений
  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-gradient-from/10 rounded-t-lg flex flex-col items-center justify-center">
        <Package className="w-12 h-12 text-secondary-light/30 mb-2" />
        <div className="text-xs text-secondary-light/50">Нет изображений</div>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-t-lg bg-gradient-from/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Карусель изображений с улучшенным эффектом перехода */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <AnimatePresence key={index} initial={false}>
            {index === currentIndex && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                {image?.image ? (
                  <motion.div
                    className="relative w-full h-full"
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <Image
                      src={image.image}
                      alt={image.title || "Компонент"}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-contain transition-transform duration-300 hover:scale-105"
                      priority={index === 0}
                    />
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Package className="w-10 h-10 text-secondary-light/30 mb-2" />
                    <span className="text-xs text-secondary-light/70">
                      Нет изображения
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Миниатюрная метка категории */}
      {images[currentIndex]?.categoryIcon && (
        <div
          className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md 
                       flex items-center gap-1.5 border border-white/10"
        >
          <div className="w-4 h-4 relative flex-shrink-0">
            <Image
              src={`/${images[currentIndex].categoryIcon}`}
              alt=""
              width={16}
              height={16}
              className="opacity-90"
            />
          </div>
          <div className="text-xs text-white/90">
            {images[currentIndex].categoryName}
          </div>
        </div>
      )}

      {/* Элементы управления (появляются при наведении) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 flex items-end justify-between p-2"
          >
            {/* Кнопка паузы/воспроизведения и индикатор прогресса */}
            {images.length > 1 && (
              <div
                className="absolute bottom-2 right-2 cursor-pointer z-10"
                onClick={handlePause}
              >
                <CircularProgressBar
                  progress={progress}
                  isPlaying={isPlaying}
                  size={28}
                />
              </div>
            )}

            {/* Индикаторы точек */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10">
                <div className="flex gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        index === currentIndex
                          ? "bg-blue-400 scale-110"
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                      onClick={(e) => handleDotClick(index, e)}
                      aria-label={`Перейти к слайду ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuildCarousel;
