import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "@/types/category";
import { usePreloadData } from "@/hooks/usePreloadData";
import { CategoryState, CategoryActions } from "../types/categories";

export const useCategories = (
  mutateProducts: () => Promise<void>,
  categories: Category[] = []
): [CategoryState, CategoryActions] => {
  const router = useRouter();
  const { preload } = usePreloadData();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Category | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchParams = useSearchParams();

  // Добавляем эффект для синхронизации с URL
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");

    if (categorySlug && categories.length > 0) {
      const category = categories.find((c) => c.slug === categorySlug);
      if (category) {
        setSelectedCategory(category);

        if (subcategorySlug && category.children) {
          const subcategory = category.children.find(
            (sc) => sc.slug === subcategorySlug
          );
          if (subcategory) {
            setSelectedSubcategory(subcategory);
          } else {
            setSelectedSubcategory(null);
          }
        } else {
          setSelectedSubcategory(null);
        }
      }
    }
  }, [searchParams, categories]);

  const preloadNextCategory = useCallback(
    (categories: Category[], currentIndex: number) => {
      if (!categories || currentIndex >= categories.length - 1) return;

      const nextCategory = categories[currentIndex + 1];
      if (nextCategory) {
        preload(`/api/products/${nextCategory.slug}`);
        if (nextCategory.children?.[0]) {
          preload(
            `/api/products/${nextCategory.slug}/${nextCategory.children[0].slug}`
          );
        }
      }
    },
    [preload]
  );

  const handleCategorySelect = useCallback(
    async (category: Category, index: number) => {
      try {
        setSelectedCategory(category);
        setSelectedSubcategory(null);
        setIsDropdownOpen(false);

        await mutateProducts(); // Убираем аргументы
        await router.replace(`/configurator?category=${category.slug}`);

        // Даем время на обновление URL
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (!category.children?.length) {
          await mutateProducts();
        }

        preloadNextCategory([category], index);
      } catch (error) {
        console.error("Error selecting category:", error);
      }
    },
    [router, mutateProducts, preloadNextCategory]
  );

  const handleSubcategorySelect = useCallback(
    async (subcategory: Category) => {
      if (!selectedCategory) return;

      try {
        setSelectedSubcategory(subcategory);

        const params = new URLSearchParams();
        params.set("category", selectedCategory.slug);
        params.set("subcategory", subcategory.slug);

        await router.replace(`/configurator?${params.toString()}`);
        await mutateProducts();
      } catch (error) {
        console.error("Error selecting subcategory:", error);
      }
    },
    [selectedCategory, router, mutateProducts]
  );

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  return [
    { selectedCategory, selectedSubcategory, isDropdownOpen },
    { handleCategorySelect, handleSubcategorySelect, toggleDropdown },
  ];
};
