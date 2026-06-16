import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { favoritesApi } from "../api/favoritesApi";

export interface FavoritesState {
  favoriteIds: number[];
  isLoading: boolean;
  error: string | null;

  loadFavorites: () => Promise<void>;
  toggleFavorite: (establishmentId: number) => Promise<void>;
  isFavorite: (establishmentId: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      isLoading: false,
      error: null,

      loadFavorites: async () => {
        set({ isLoading: true, error: null });
        try {
          const favorites = await favoritesApi.getFavorites();
          set({ favoriteIds: favorites.map((f) => f.id), isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error?.message || "Erreur de chargement" });
        }
      },

      toggleFavorite: async (establishmentId: number) => {
        const { favoriteIds } = get();
        const isCurrentlyFavorited = favoriteIds.includes(establishmentId);

        try {
          if (isCurrentlyFavorited) {
            await favoritesApi.removeFavorite(establishmentId);
            set({ favoriteIds: favoriteIds.filter((id) => id !== establishmentId) });
          } else {
            await favoritesApi.addFavorite(establishmentId);
            set({ favoriteIds: [...favoriteIds, establishmentId] });
          }
        } catch (error: any) {
          set({ error: error?.message || "Erreur" });
        }
      },

      isFavorite: (establishmentId: number) => {
        return get().favoriteIds.includes(establishmentId);
      },
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favoriteIds: state.favoriteIds }),
    },
  ),
);

export const useFavorites = () => {
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const isLoading = useFavoritesStore((s) => s.isLoading);
  const error = useFavoritesStore((s) => s.error);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  return { favoriteIds, isLoading, error, loadFavorites, toggleFavorite, isFavorite };
};
