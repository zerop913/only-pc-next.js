import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface ProductGalleryProps {
  image?: string | null;
  title: string;
}

export default function ProductGallery({ image, title }: ProductGalleryProps) {
  const [imageLoading, setImageLoading] = useState(true);

  const getImagePath = (imageSrc: string | undefined | null): string => {
    if (!imageSrc) return "";
    return imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`;
  };

  return (
    <div className="w-full bg-gradient-from/10 border border-primary-border rounded-xl overflow-hidden shadow-md">
      <div className="relative w-full aspect-square lg:aspect-[4/3]">
        {image ? (
          <>
            <div
              className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${
                imageLoading ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="animate-pulse w-12 h-12 rounded-full bg-gradient-from/30" />
            </div>
            <Image
              src={getImagePath(image)}
              alt={title}
              fill
              className={`
                object-contain p-4 transition-opacity duration-300
                ${imageLoading ? "opacity-0" : "opacity-100"}
              `}
              onLoadingComplete={() => setImageLoading(false)}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-24 h-24 text-secondary-light" />
          </div>
        )}
      </div>
    </div>
  );
}
