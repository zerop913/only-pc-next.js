import React, { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import {
  getImageUrl,
  getOptimizedImageUrl,
  getThumbnailUrl,
} from "@/lib/utils/imageUtils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number | "auto";
  /** Использовать thumbnail версию для малых изображений */
  thumbnail?: boolean;
  /** Размер thumbnail (если thumbnail=true) */
  thumbnailSize?: number;
  /** Показать плейсхолдер при загрузке */
  showPlaceholder?: boolean;
}

export default function ProductImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  sizes,
  priority = false,
  quality = "auto",
  thumbnail = false,
  thumbnailSize = 200,
  showPlaceholder = true,
}: ProductImageProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Определяем какой URL использовать
  const getImageSrc = () => {
    if (!src) return null;

    if (thumbnail) {
      return getThumbnailUrl(src, thumbnailSize);
    }

    if (width || height) {
      return getOptimizedImageUrl(src, width, height, quality);
    }

    return getImageUrl(src);
  };

  const imageSrc = getImageSrc();

  // Если нет изображения или произошла ошибка, показываем плейсхолдер
  if (!imageSrc || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-from/10 border border-primary-border/50 rounded ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-secondary-light" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Плейсхолдер при загрузке */}
      {showPlaceholder && imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-from/10 animate-pulse">
          <ImageIcon className="w-8 h-8 text-secondary-light" />
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={typeof quality === "number" ? quality : undefined}
        className={`transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"} ${className}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
}

// Специализированные компоненты для частых случаев использования

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function ProductThumbnail({
  src,
  alt,
  size = 64,
  className = "",
}: ProductThumbnailProps) {
  return (
    <ProductImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      thumbnail
      thumbnailSize={size}
      className={`w-${size / 4} h-${size / 4} rounded-lg ${className}`}
    />
  );
}

interface ProductCardImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function ProductCardImage({
  src,
  alt,
  className = "",
}: ProductCardImageProps) {
  return (
    <ProductImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={`object-contain ${className}`}
    />
  );
}

interface ProductGalleryImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductGalleryImage({
  src,
  alt,
  width = 800,
  height = 800,
  className = "",
}: ProductGalleryImageProps) {
  return (
    <ProductImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes="(max-width: 768px) 100vw, 800px"
      priority
      className={`object-contain ${className}`}
    />
  );
}
