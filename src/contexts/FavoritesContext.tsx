"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { Product } from "@/types/product";
import { FavoriteItem, FavoritesMap } from "@/types/favorite";
import {
  getStandardCookie,
  setStandardCookie,
  COOKIE_KEYS,
} from "@/utils/cookieUtils";

interface FavoritesContextType {
  favorites: FavoritesMap;
  isLoading: boolean;
  addToFavorites: (productId: number) => Promise<void>;
  removeFromFavorites: (
    favoriteIdOrProductId: number,
    isProductId?: boolean
  ) => Promise<void>;
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
  const [hasMigrated, setHasMigrated] = useState(false);
  
  // Флаг для отслеживания, были ли уже загружены данные
  const hasInitializedRef = useRef(false);

  // Загрузка избранного при монтировании
  const fetchFavorites = useCallback(async (force = false) => {
    // Если данные уже загружены и не требуется принудительная загрузка, пропускаем запрос
    if (!force && Object.keys(favorites).length > 0 && hasInitializedRef.current) {
      console.log("Skipping favorites fetch - data already loaded");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/favorites");
      const data = await response.json();
      
      if (response.ok) {
        setFavorites(data.favorites);
        hasInitializedRef.current = true;
        
        // Сохраняем в куки для гостей и быстрого доступа
        if (!user) {
          setStandardCookie(COOKIE_KEYS.FAVORITES, data.favorites);
        }

        // Обновляем Set с ID избранных товаров
        const ids = new Set<number>();
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
      // Пробуем загрузить из куков при ошибке запроса
      const cookieFavorites = getStandardCookie(COOKIE_KEYS.FAVORITES);
      if (cookieFavorites) {
        setFavorites(cookieFavorites);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, favorites]);

  // Загружаем данные только один раз при монтировании
  useEffect(() => {
    if (!hasInitializedRef.current) {
      console.log("Initial favorites fetch");
      fetchFavorites();
    }
  }, [fetchFavorites]);

  // Обновляем куки при изменении избранного
  useEffect(() => {
    if (!user && Object.keys(favorites).length > 0) {
      setStandardCookie(COOKIE_KEYS.FAVORITES, favorites);
    }
  }, [favorites, user]);

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
            await fetchFavorites(true); // Принудительная загрузка после миграции
          }
        } catch (error) {
          console.error("Error migrating favorites:", error);
          setHasMigrated(false); // Сбрасываем флаг в случае ошибки
        }
      }
    };

    migrateLocalFavorites();
  }, [user, fetchFavorites, favoriteIds, hasMigrated]);

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
            const item = categoryItems.find((item) => item.id === favoriteId);
            if (item) {
              productId = item.productId;
              break;
            }
          }
        }

        console.log("Removing from favorites:", {
          favoriteId,
          productId,
          isProductId,
        });

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

        if (response.ok) {
          console.log("Successfully removed from favorites");
        } else {
          console.error("Failed to remove from favorites, reverting state");
          // Если запрос не удался, откатываем изменения
          await fetchFavorites();
        }
      } catch (error) {
        console.error("Error removing from favorites:", error);
        // В случае ошибки обновляем состояние с сервера
        await fetchFavorites();
      }
    },
    [fetchFavorites]
  );  const addToFavorites = useCallback(
    async (productId: number) => {
      try {
        // Проверяем, уже в избранном или нет
        const wasInFavorites = isFavorite(productId);
        console.log(
          `Adding/removing product ${productId} to/from favorites, current state: ${wasInFavorites ? "in favorites" : "not in favorites"}`
        );

        // Оптимистично обновляем UI до запроса к серверу
        if (wasInFavorites) {
          // Находим favoriteId для этого productId
          let favoriteIdToRemove: number | undefined;
          for (const categoryItems of Object.values(favorites)) {
            const item = categoryItems.find(
              (item) => item.productId === productId
            );
            if (item) {
              favoriteIdToRemove = item.id;
              break;
            }
          }

          // Немедленно обновляем состояние чтобы UI обновился
          setFavoriteIds((prev) => {
            const newIds = new Set(prev);
            newIds.delete(productId);
            return newIds;
          });
          
          // Если нашли ID в избранном, сразу обновляем список избранного
          if (favoriteIdToRemove) {
            setFavorites((prev) => {
              const newFavorites: FavoritesMap = {};
              for (const [categoryId, products] of Object.entries(prev)) {
                const filteredProducts = products.filter(
                  (item) => item.id !== favoriteIdToRemove
                );
                if (filteredProducts.length > 0) {
                  newFavorites[Number(categoryId)] = filteredProducts;
                }
              }
              return newFavorites;
            });
          }
        } else {
          // Временно добавляем в локальное состояние
          setFavoriteIds((prev) => {
            const newIds = new Set(prev);
            newIds.add(productId);
            return newIds;
          });
        }

        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          // Обновляем состояние после успешного запроса
          await fetchFavorites();
          console.log("Successfully toggled favorite status");
        } else {
          console.error("Error response from server when toggling favorite");
          // В случае ошибки восстанавливаем предыдущее состояние
          if (wasInFavorites) {
            setFavoriteIds((prev) => {
              const newIds = new Set(prev);
              newIds.add(productId);
              return newIds;
            });
          } else {
            setFavoriteIds((prev) => {
              const newIds = new Set(prev);
              newIds.delete(productId);
              return newIds;
            });
          }
          await fetchFavorites();
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        // В случае ошибки обновляем состояние с сервера
        await fetchFavorites();
      }
    },
    [fetchFavorites, favorites, isFavorite]
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
