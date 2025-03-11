import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const usePagination = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updatePage = useCallback(
    async (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());

      // Используем push вместо replace
      await router.push(`/configurator?${params.toString()}`);
    },
    [router, searchParams]
  );

  const getCurrentPage = useCallback(() => {
    return Number(searchParams.get("page")) || 1;
  }, [searchParams]);

  return {
    updatePage,
    getCurrentPage,
  };
};
