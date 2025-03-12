import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductState } from "../types/categories";

const fetcher = async (url: string) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("Server error:", data.error);
      return {
        products: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      };
    }

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      products: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
};

export const useProducts = (getProductsUrl: () => string | null) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProductState>({
    products: [],
    isLoading: false,
    totalPrice: 0,
  });
  const prevPageRef = useRef<string | null>(null);

  const { data: productsData, mutate } = useSWR(getProductsUrl(), fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 5000,
  });

  const handlePageChange = useCallback(
    async (page: number) => {
      if (state.isLoading) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());

        await router.replace(`/configurator?${params.toString()}`, {
          scroll: false,
        });

        await mutate();
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [router, searchParams, mutate, state.isLoading]
  );

  return {
    productsData,
    state,
    setState,
    mutate,
    handlePageChange,
  };
};
