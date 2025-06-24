"use client";

import { useEffect, useState } from "react";
import { getImageUrl } from "@/lib/utils/imageUtils";

interface ImageDebugProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function ImageDebug({
  src,
  alt,
  width = 200,
  height = 200,
  className = "",
}: ImageDebugProps) {
  const [actualSrc, setActualSrc] = useState("");
  const [isCloudinary, setIsCloudinary] = useState(false);

  useEffect(() => {
    const processedSrc = getImageUrl(src);
    setActualSrc(processedSrc);
    setIsCloudinary(processedSrc.includes("cloudinary.com"));

    console.log(
      `🖼️ ImageDebug: ${src} -> ${processedSrc} (Cloudinary: ${processedSrc.includes("cloudinary.com")})`
    );
  }, [src]);

  return (
    <div className="border p-2 m-2">
      <div className="text-xs mb-2">
        <div>
          <strong>Original:</strong> {src}
        </div>
        <div>
          <strong>Processed:</strong> {actualSrc}
        </div>
        <div>
          <strong>Source:</strong>{" "}
          <span className={isCloudinary ? "text-green-600" : "text-blue-600"}>
            {isCloudinary ? "Cloudinary" : "Local"}
          </span>
        </div>
      </div>
      <img
        src={actualSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={() => console.log(`✅ Loaded: ${actualSrc}`)}
        onError={() => console.log(`❌ Error loading: ${actualSrc}`)}
      />
    </div>
  );
}
