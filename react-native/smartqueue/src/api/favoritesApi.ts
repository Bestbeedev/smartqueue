import axiosClient from './axiosClient';
import { Establishment } from './establishmentsApi';

export const favoritesApi = {
  getFavorites: async (): Promise<Establishment[]> => {
    const response = await axiosClient.get('/favorites');
    return response.data;
  },

  addFavorite: async (establishmentId: number): Promise<void> => {
    await axiosClient.post(`/favorites/${establishmentId}`);
  },

  removeFavorite: async (establishmentId: number): Promise<void> => {
    await axiosClient.delete(`/favorites/${establishmentId}`);
  },

  getFavoriteStatus: async (establishmentId: number): Promise<boolean> => {
    const response = await axiosClient.get(`/favorites/${establishmentId}/status`);
    return response.data.is_favorited;
  },
};
