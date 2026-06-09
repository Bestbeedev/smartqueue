import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

// Get notifications module safely
const getNotifications = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    return Notifications;
  } catch (e) {
    return null;
  }
};

/**
 * Hook simple pour envoyer des notifications locales
 */
export const useSimpleNotification = () => {
  const sendNotification = useCallback(async ({
    title,
    body,
    sound = true,
    vibrate = true,
    data,
  }: {
    title: string;
    body: string;
    sound?: boolean;
    vibrate?: boolean;
    data?: Record<string, any>;
  }) => {
    if (vibrate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const Notifications = getNotifications();
    if (Notifications?.scheduleNotificationAsync) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: sound ? 'default' : undefined,
            data: data ?? {},
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }
  }, []);

  const notifyTicketCreated = useCallback((ticketNumber: string, establishmentName: string, ticketId?: number) => {
    sendNotification({
      title: '🎫 Ticket pris avec succès !',
      body: `Votre ticket ${ticketNumber} pour ${establishmentName} est actif. Suivez votre position en temps réel.`,
      data: ticketId ? { ticket_id: ticketId } : {},
    });
  }, [sendNotification]);

  const notifyCrowdLevelChange = useCallback((
    establishmentName: string,
    previousLevel: string,
    newLevel: string,
    peopleWaiting: number
  ) => {
    const isBetter = ['low', 'moderate', 'high'].indexOf(newLevel) < ['low', 'moderate', 'high'].indexOf(previousLevel);
    
    if (isBetter) {
      sendNotification({
        title: '📉 Affluence en baisse !',
        body: `${establishmentName} est moins chargé maintenant (${peopleWaiting} personnes). C'est le bon moment !`,
      });
    } else {
      sendNotification({
        title: '⚠️ Affluence en hausse',
        body: `${establishmentName} devient plus chargé (${peopleWaiting} personnes en attente).`,
      });
    }
  }, [sendNotification]);

  const notifyEstablishmentOpen = useCallback((establishmentName: string) => {
    sendNotification({
      title: '🔔 Ouverture !',
      body: `${establishmentName} vient d'ouvrir. Rejoignez la file maintenant pour être parmi les premiers !`,
    });
  }, [sendNotification]);

  const notifyWeeklySummary = useCallback((stats: {
    visitsCount: number;
    timeSaved: number;
    favoriteEstablishment: string;
  }) => {
    sendNotification({
      title: '📊 Récapitulatif de votre semaine',
      body: `${stats.visitsCount} visites, ${stats.timeSaved} min économisées. Votre favori: ${stats.favoriteEstablishment}`,
    });
  }, [sendNotification]);

  return {
    sendNotification,
    notifyTicketCreated,
    notifyCrowdLevelChange,
    notifyEstablishmentOpen,
    notifyWeeklySummary,
  };
};

export default useSimpleNotification;
