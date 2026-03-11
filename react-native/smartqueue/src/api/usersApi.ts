import axiosClient from './axiosClient';

// Types pour les utilisateurs
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface UserPreferences {
  push_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  vibration_enabled: boolean;
  sound_enabled: boolean;
  language: string;
  dark_mode: boolean;
  location_sharing: boolean;
  proximity_alerts: boolean;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  position_updates: boolean;
  queue_alerts: boolean;
  promotions: boolean;
  reminders: boolean;
}

export interface AvatarData {
  avatar: string; // base64 encoded image
}

// Fonctions API pour les utilisateurs
export const usersApi = {
  // Obtenir le profil utilisateur courant
  getProfile: async (): Promise<User> => {
    const response = await axiosClient.get('/me');
    return response.data;
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (data: UpdateUserData): Promise<User> => {
    const response = await axiosClient.put('/me', data);
    return response.data;
  },

  // Mettre à jour l'avatar
  updateAvatar: async (avatarData: AvatarData): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: avatarData.avatar,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await axiosClient.post('/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obtenir les préférences de l'utilisateur
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await axiosClient.get('/me/preferences');
    return response.data;
  },

  // Mettre à jour les préférences de l'utilisateur
  updatePreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await axiosClient.put('/me/preferences', preferences);
    return response.data;
  },

  // Obtenir les préférences de notification
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await axiosClient.get('/notification-preferences');
    return response.data;
  },

  // Mettre à jour les préférences de notification
  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await axiosClient.put('/notification-preferences', preferences);
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await axiosClient.put('/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Supprimer le compte utilisateur
  deleteAccount: async (password: string): Promise<void> => {
    await axiosClient.delete('/me', { data: { password } });
  },

  // Obtenir les statistiques de l'utilisateur
  getUserStats: async (): Promise<{
    total_tickets: number;
    avg_wait_time: number;
    favorite_establishments: number;
    member_since: string;
    last_visit: string;
  }> => {
    const response = await axiosClient.get('/me/stats');
    return response.data;
  },

  // Obtenir les établissements favoris
  getFavoriteEstablishments: async (): Promise<number[]> => {
    const response = await axiosClient.get('/me/favorites');
    return response.data;
  },

  // Ajouter un établissement aux favoris
  addFavoriteEstablishment: async (establishmentId: number): Promise<void> => {
    await axiosClient.post('/me/favorites', { establishment_id: establishmentId });
  },

  // Retirer un établissement des favoris
  removeFavoriteEstablishment: async (establishmentId: number): Promise<void> => {
    await axiosClient.delete(`/me/favorites/${establishmentId}`);
  },

  // Obtenir l'historique des visites
  getVisitHistory: async (limit: number = 10): Promise<{
    establishment_id: number;
    establishment_name: string;
    visited_at: string;
    ticket_count: number;
  }[]> => {
    const response = await axiosClient.get('/me/visits', { params: { limit } });
    return response.data;
  },

  // Exporter les données utilisateur (GDPR)
  exportUserData: async (): Promise<{
    user: User;
    tickets: any[];
    preferences: UserPreferences;
    export_date: string;
  }> => {
    const response = await axiosClient.get('/me/export');
    return response.data;
  },

  // Désactiver temporairement le compte
  deactivateAccount: async (reason?: string): Promise<void> => {
    await axiosClient.post('/me/deactivate', { reason });
  },

  // Réactiver le compte
  reactivateAccount: async (): Promise<void> => {
    await axiosClient.post('/me/reactivate');
  },

  // Signaler un problème
  reportIssue: async (data: {
    type: string;
    description: string;
    ticket_id?: number;
    establishment_id?: number;
  }): Promise<void> => {
    await axiosClient.post('/me/report', data);
  },

  // Donner un feedback
  submitFeedback: async (data: {
    rating: number;
    comment?: string;
    ticket_id?: number;
    establishment_id?: number;
  }): Promise<void> => {
    await axiosClient.post('/me/feedback', data);
  },
};

export default usersApi;
