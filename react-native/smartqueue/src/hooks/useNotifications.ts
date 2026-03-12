import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomAlert } from './useCustomAlert';

// Types pour les notifications
export interface NotificationPermission {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'disabled' | 'restricted' | 'never_ask_again';
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  vibrate?: boolean;
  priority?: 'default' | 'high' | 'max';
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: Record<string, any>;
}

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion: string;
}

// Hook pour la gestion des notifications
export const useNotifications = () => {
  const { showWarning } = useCustomAlert();
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    canAskAgain: true,
    status: 'denied',
  });
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  // Vérifier la permission de notification
  const checkPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      // Note: Ceci nécessite l'installation de @react-native-firebase/messaging
      // et react-native-permissions
      
      if (Platform.OS === 'ios') {
        // const authStatus = await messaging().requestPermission();
        // const enabled =
        //   authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        //   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        // return {
        //   granted: enabled,
        //   canAskAgain: authStatus !== messaging.AuthorizationStatus.DENIED,
        //   status: enabled ? 'granted' : 'denied',
        // };
        
        // Simulation pour l'instant
        const simulatedPermission = {
          granted: true,
          canAskAgain: true,
          status: 'granted' as const,
        };
        setPermission(simulatedPermission);
        return simulatedPermission;
      } else if (Platform.OS === 'android') {
        // Android 13+ nécessite la permission POST_NOTIFICATIONS
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          const androidPermission = {
            granted,
            canAskAgain: true,
            status: granted ? 'granted' : 'denied' as const,
          };
          setPermission(androidPermission);
          return androidPermission;
        } else {
          // Android < 13, permission accordée par défaut
          const defaultPermission = {
            granted: true,
            canAskAgain: true,
            status: 'granted' as const,
          };
          setPermission(defaultPermission);
          return defaultPermission;
        }
      }

      const defaultPermission = {
        granted: false,
        canAskAgain: true,
        status: 'denied' as const,
      };
      setPermission(defaultPermission);
      return defaultPermission;
    } catch (err) {
      console.error('Error checking notification permission:', err);
      const errorPermission = {
        granted: false,
        canAskAgain: true,
        status: 'denied' as const,
      };
      setPermission(errorPermission);
      return errorPermission;
    }
  }, []);

  // Demander la permission de notification
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      setIsLoading(true);
      setError(null);

      if (Platform.OS === 'ios') {
        // const authStatus = await messaging().requestPermission();
        // const enabled =
        //   authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        //   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        // const newPermission = {
        //   granted: enabled,
        //   canAskAgain: authStatus !== messaging.AuthorizationStatus.DENIED,
        //   status: enabled ? 'granted' : 'denied',
        // };
        
        // Simulation pour l'instant
        const newPermission = {
          granted: true,
          canAskAgain: true,
          status: 'granted' as const,
        };
        setPermission(newPermission);
        setIsLoading(false);
        return newPermission;
      } else if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Permission de notifications',
              message: 'SmartQueue a besoin d\'envoyer des notifications pour vous alerter quand c\'est votre tour.',
              buttonNeutral: 'Demander plus tard',
              buttonNegative: 'Annuler',
              buttonPositive: 'OK',
            }
          );

          const newPermission = {
            granted: granted === PermissionsAndroid.RESULTS.GRANTED,
            canAskAgain: true,
            status: granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied' as const,
          };
          setPermission(newPermission);
          setIsLoading(false);
          return newPermission;
        } else {
          // Android < 13, permission accordée par défaut
          const defaultPermission = {
            granted: true,
            canAskAgain: true,
            status: 'granted' as const,
          };
          setPermission(defaultPermission);
          setIsLoading(false);
          return defaultPermission;
        }
      }

      const defaultPermission = {
        granted: false,
        canAskAgain: true,
        status: 'denied' as const,
      };
      setPermission(defaultPermission);
      setIsLoading(false);
      return defaultPermission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError('Erreur lors de la demande de permission de notification');
      setIsLoading(false);
      
      const errorPermission = {
        granted: false,
        canAskAgain: true,
        status: 'denied' as const,
      };
      setPermission(errorPermission);
      return errorPermission;
    }
  }, []);

  // Obtenir le token FCM
  const getFCMToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Note: Ceci nécessite l'installation de @react-native-firebase/messaging
      // const token = await messaging().getToken();
      
      // Simulation pour l'instant
      const simulatedToken = 'simulated_fcm_token_' + Date.now();
      setFcmToken(simulatedToken);
      await AsyncStorage.setItem('fcm_token', simulatedToken);
      
      setIsLoading(false);
      return simulatedToken;
    } catch (err) {
      console.error('Error getting FCM token:', err);
      setError('Erreur lors de l\'obtention du token de notification');
      setIsLoading(false);
      return null;
    }
  }, []);

  // Enregistrer le token FCM auprès du backend
  const registerFCMToken = useCallback(async (deviceId: string): Promise<void> => {
    try {
      const token = fcmToken || await getFCMToken();
      
      if (!token) {
        throw new Error('No FCM token available');
      }

      // Note: Ceci nécessite l'installation de l'API client
      // await authApi.registerDevice({
      //   device_id: deviceId,
      //   platform: Platform.OS as 'ios' | 'android',
      //   token,
      //   app_version: '1.0.0',
      //   os_version: Platform.Version.toString(),
      // });

      console.log('FCM token registered successfully');
    } catch (err) {
      console.error('Error registering FCM token:', err);
      setError('Erreur lors de l\'enregistrement du token de notification');
    }
  }, [fcmToken, getFCMToken]);

  // Envoyer une notification locale
  const sendLocalNotification = useCallback(async (data: NotificationData): Promise<void> => {
    try {
      // Note: Ceci nécessite l'installation de react-native-push-notification ou expo-notifications
      
      // Avec expo-notifications:
      // await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: data.title,
      //     body: data.body,
      //     data: data.data,
      //     sound: data.sound || 'default',
      //   },
      //   trigger: null,
      // });

      console.log('Local notification sent:', data);
    } catch (err) {
      console.error('Error sending local notification:', err);
      setError('Erreur lors de l\'envoi de la notification locale');
    }
  }, []);

  // Programmer une notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduledTime: Date,
    data?: Record<string, any>
  ): Promise<string | null> => {
    try {
      const notificationId = `notification_${Date.now()}`;
      
      // Note: Ceci nécessite l'installation de react-native-push-notification ou expo-notifications
      
      // Avec expo-notifications:
      // const id = await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title,
      //     body,
      //     data,
      //   },
      //   trigger: {
      //     date: scheduledTime,
      //   },
      // });

      const newScheduledNotification: ScheduledNotification = {
        id: notificationId,
        title,
        body,
        scheduledTime,
        data,
      };

      setScheduledNotifications(prev => [...prev, newScheduledNotification]);
      
      console.log('Notification scheduled:', newScheduledNotification);
      return notificationId;
    } catch (err) {
      console.error('Error scheduling notification:', err);
      setError('Erreur lors de la programmation de la notification');
      return null;
    }
  }, []);

  // Annuler une notification programmée
  const cancelScheduledNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      // Note: Ceci nécessite l'installation de react-native-push-notification ou expo-notifications
      
      // Avec expo-notifications:
      // await Notifications.cancelScheduledNotificationAsync(notificationId);

      setScheduledNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      console.log('Scheduled notification cancelled:', notificationId);
    } catch (err) {
      console.error('Error cancelling scheduled notification:', err);
      setError('Erreur lors de l\'annulation de la notification programmée');
    }
  }, []);

  // Effacer toutes les notifications programmées
  const clearAllScheduledNotifications = useCallback(async (): Promise<void> => {
    try {
      // Note: Ceci nécessite l'installation de react-native-push-notification ou expo-notifications
      
      // Avec expo-notifications:
      // await Notifications.cancelAllScheduledNotificationsAsync();

      setScheduledNotifications([]);
      console.log('All scheduled notifications cleared');
    } catch (err) {
      console.error('Error clearing scheduled notifications:', err);
      setError('Erreur lors de la suppression des notifications programmées');
    }
  }, []);

  // Afficher une alerte pour demander la permission
  const showPermissionAlert = useCallback(() => {
    showWarning(
      'Notifications requises',
      'SmartQueue a besoin d\'envoyer des notifications pour vous alerter quand c\'est votre tour dans la file d\'attente.',
      'Autoriser',
      () => requestPermission(),
      'Annuler'
    );
  }, [requestPermission, showWarning]);

  // Initialiser les notifications
  const initializeNotifications = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Vérifier la permission
      const currentPermission = await checkPermission();
      
      if (currentPermission.granted) {
        // Obtenir le token FCM
        await getFCMToken();
        
        // Configurer les handlers pour les notifications en foreground et background
        // Note: Ceci nécessite @react-native-firebase/messaging
        
        // messaging().onNotificationOpenedApp(remoteMessage => {
        //   console.log('Notification caused app to open from background state:', remoteMessage);
        // });
        
        // messaging().onMessage(async remoteMessage => {
        //   console.log('Received message in foreground:', remoteMessage);
        //   await sendLocalNotification({
        //     title: remoteMessage.notification?.title || 'Nouvelle notification',
        //     body: remoteMessage.notification?.body || '',
        //     data: remoteMessage.data,
        //   });
        // });
        
        // messaging().setBackgroundMessageHandler(async remoteMessage => {
        //   console.log('Handled background message:', remoteMessage);
        // });
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing notifications:', err);
      setError('Erreur lors de l\'initialisation des notifications');
      setIsLoading(false);
    }
  }, [checkPermission, getFCMToken, sendLocalNotification]);

  // Effet pour initialiser les notifications au montage
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // Effet pour charger le token FCM depuis le stockage
  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('fcm_token');
        if (storedToken) {
          setFcmToken(storedToken);
        }
      } catch (err) {
        console.error('Error loading stored FCM token:', err);
      }
    };

    loadStoredToken();
  }, []);

  return {
    // État
    permission,
    fcmToken,
    isLoading,
    error,
    scheduledNotifications,
    
    // Actions
    checkPermission,
    requestPermission,
    getFCMToken,
    registerFCMToken,
    sendLocalNotification,
    scheduleNotification,
    cancelScheduledNotification,
    clearAllScheduledNotifications,
    showPermissionAlert,
    initializeNotifications,
    
    // Propriétés calculées
    hasPermission: permission.granted,
    canRequestPermission: permission.canAskAgain,
    isInitialized: fcmToken !== null,
  };
};

export default useNotifications;
