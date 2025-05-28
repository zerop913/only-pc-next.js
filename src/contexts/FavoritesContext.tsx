"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { Product } from "@/types/product";
import { FavoriteItem, FavoritesMap } from "@/types/favorite";

interface FavoritesContextType {
  favorites: FavoritesMap;
  isLoading: boolean;
  addToFavorites: (productId: number) => Promise<void>;
  removeFromFavorites: (favoriteIdOrProductId: number, isProductId?: boolean) => Promise<void>;
  clearAllFavorites: () => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [hasMigrated, setHasMigrated] = useState(false); // Добавляем флаг миграции

  // Загрузка избранного при монтировании
  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/favorites");
      const data = await response.json();
      if (response.ok) {
        setFavorites(data.favorites);
        // Обновляем Set с ID избранных товаров
        const ids = new Set<number>();
        // Добавляем явную типизацию для items
        Object.values(data.favorites).forEach((categoryItems: any) => {
          if (Array.isArray(categoryItems)) {
            categoryItems.forEach((item: FavoriteItem) => {
              if (item && item.product && typeof item.product.id === "number") {
                ids.add(item.product.id);
              }
            });
          }
        });
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Эффект для отслеживания изменения состояния авторизации
  useEffect(() => {
    const migrateLocalFavorites = async () => {
      if (user && !hasMigrated) {
        // Проверяем флаг миграции
        try {
          const temporaryIds = Array.from(favoriteIds);

          if (temporaryIds.length > 0) {
            setHasMigrated(true); // Устанавливаем флаг перед миграцией
            await fetch("/api/favorites/merge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ temporaryIds }),
            });
            await fetchFavorites();
          }
        } catch (error) {
          console.error("Error migrating favorites:", error);
          setHasMigrated(false); // Сбрасываем флаг в случае ошибки
        }
      }
    };

    migrateLocalFavorites();
  }, [user, fetchFavorites, favoriteIds, hasMigrated]); // Добавляем hasMigrated в зависимости

  // Сбрасываем флаг миграции при выходе пользователя
  useEffect(() => {
    if (!user) {
      setHasMigrated(false);
    }
  }, [user]);

  const isFavorite = useCallback(
    (productId: number) => {
      return favoriteIds.has(productId);
    },
    [favoriteIds]
  );
  const removeFromFavorites = useCallback(
    async (favoriteIdOrProductId: number, isProductId: boolean = false) => {
      try {
        let productId: number | undefined;
        let favoriteId: number | undefined;
        
        // Определяем тип идентификатора
        if (isProductId) {
          productId = favoriteIdOrProductId;
        } else {
          favoriteId = favoriteIdOrProductId;
          
          // Найдем productId по favoriteId для обновления локального состояния
          for (const categoryItems of Object.values(favorites)) {
            const item = categoryItems.find(item => item.id === favoriteId);
            if (item) {
              productId = item.productId;
              break;
            }
          }
        }

        // Оптимистичное обновление: удаляем из локального состояния сразу
        setFavorites((prev) => {
          const newFavorites: FavoritesMap = {};
          for (const [categoryId, products] of Object.entries(prev)) {
            let filteredProducts;
            if (favoriteId) {
              filteredProducts = products.filter(
                (item) => item.id !== favoriteId
              );
            } else if (productId) {
              filteredProducts = products.filter(
                (item) => item.productId !== productId
              );
            } else {
              filteredProducts = products;
            }
            if (filteredProducts.length > 0) {
              newFavorites[Number(categoryId)] = filteredProducts;
            }
          }
          return newFavorites;
        });
        
        // Обновляем set с ID продуктов
        if (productId) {
          setFavoriteIds((prev) => {
            const newIds = new Set(prev);
            newIds.delete(productId);
            return newIds;
          });
        }

        // Отправляем запрос на сервер
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(favoriteId ? { favoriteId } : { productId }),
        });

        // Если запрос не удался, откатываем изменения
        if (!response.ok) {
          await fetchFavorites();
        }
      } catch (error) {
        console.error("Error removing from favorites:", error);
        // В случае ошибки обновляем состояние с сервера
        await fetchFavorites();
      }
    },
    [fetchFavorites]
  );

  const addToFavorites = useCallback(
    async (productId: number) => {
      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          // Сразу обновляем состояние после успешного запроса
          await fetchFavorites();
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [fetchFavorites]
  );

  const clearAllFavorites = useCallback(async () => {
    try {
      // Оптимистичное обновление: очищаем локальное состояние сразу
      setFavorites({});
      setFavoriteIds(new Set());

      // Отправляем запрос на сервер для очистки всех избранных
      const response = await fetch("/api/favorites/clear", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      // Если запрос не удался, обновляем состояние с сервера
      if (!response.ok) {
        await fetchFavorites();
      }
    } catch (error) {
      console.error("Error clearing favorites:", error);
      // В случае ошибки обновляем состояние с сервера
      await fetchFavorites();
    }
  }, [fetchFavorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        addToFavorites,
        removeFromFavorites,
        clearAllFavorites,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    console.error(
      "FavoritesContext not found. Make sure you are using FavoritesProvider"
    );
    // Возвращаем базовое состояние вместо выброса ошибки
  return {
      favorites: {},
      isLoading: true,
      addToFavorites: async () => {},
      removeFromFavorites: async (_: number, __?: boolean) => {},
      clearAllFavorites: async () => {},
      isFavorite: () => false,
    };
  }
  return context;
};
