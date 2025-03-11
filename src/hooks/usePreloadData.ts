import { useCallback, useRef } from "react";

type PreloadFunction = (url: string) => Promise<void>;

export const usePreloadData = () => {
  const preloadedUrls = useRef<Set<string>>(new Set());

  const preload: PreloadFunction = useCallback(async (url: string) => {
    if (preloadedUrls.current.has(url)) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 60 },
      });

      clearTimeout(timeoutId);
      preloadedUrls.current.add(url);
    } catch (error) {
      console.error("Preload error:", error);
    }
  }, []);

  return { preload };
};
