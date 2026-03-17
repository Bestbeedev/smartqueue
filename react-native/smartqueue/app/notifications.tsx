import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationsApi, Notification } from '../src/api/notificationsApi';
import { useCustomAlert } from '../src/hooks/useCustomAlert';

// Format date relative (e.g., "Il y a 5 min")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Group notifications by date
function groupNotificationsByDate(notifications: Notification[]) {
  const groups: { [key: string]: Notification[] } = {};
  
  notifications.forEach((notif) => {
    const date = new Date(notif.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Hier";
    } else {
      key = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(notif);
  });
  
  return groups;
}

// Get icon and color based on notification type
function getNotificationStyle(type: string) {
  switch (type) {
    case 'success':
      return { icon: 'checkmark-circle', color: '#10B981', bgColor: '#D1FAE5' };
    case 'warning':
      return { icon: 'notifications', color: '#F59E0B', bgColor: '#FEF3C7' };
    case 'error':
      return { icon: 'alert-circle', color: '#EF4444', bgColor: '#FEE2E2' };
    case 'info':
    default:
      return { icon: 'information-circle', color: '#3B82F6', bgColor: '#DBEAFE' };
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { AlertComponent, showSuccess, showError } = useCustomAlert();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      console.log('[Notifications] Loading notifications...');
      const [notifsResponse, countResponse] = await Promise.all([
        notificationsApi.getNotifications(),
        notificationsApi.getUnreadCount(),
      ]);
      console.log('[Notifications] Response type:', typeof notifsResponse);
      console.log('[Notifications] Response.data type:', typeof notifsResponse.data);
      console.log('[Notifications] Response.data isArray:', Array.isArray(notifsResponse.data));
      console.log('[Notifications] Response.data length:', notifsResponse.data?.length);
      
      const notificationsData = Array.isArray(notifsResponse.data) ? notifsResponse.data : [];
      console.log('[Notifications] Setting notifications:', notificationsData.length, 'items');
      
      setNotifications(notificationsData);
      setUnreadCount(countResponse.count);
    } catch (err) {
      console.error('[Notifications] Error:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setNotifications, setUnreadCount, setError, setLoading, setRefreshing]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      showError('Erreur', 'Impossible de marquer comme lu');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      showSuccess('Succès', 'Toutes les notifications sont marquées comme lues');
    } catch (err) {
      showError('Erreur', 'Impossible de marquer tout comme lu');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      showError('Erreur', 'Impossible de supprimer la notification');
    }
  };

  const groupedNotifications = groupNotificationsByDate(notifications);
  const hasNotifications = notifications.length > 0;
  
  console.log('[Notifications] hasNotifications:', hasNotifications);
  console.log('[Notifications] notifications.length:', notifications.length);
  console.log('[Notifications] groupedNotifications:', Object.keys(groupedNotifications));

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#3B82F6', '#2563EB', '#1D4ED8']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <LinearGradient colors={['#3B82F6', '#2563EB', '#1D4ED8']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity 
            style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]} 
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>
              Tout lire
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : !hasNotifications ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            {console.log('[Notifications] Rendering empty state - hasNotifications:', hasNotifications, 'length:', notifications.length)}
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous serez informé quand votre ticket sera appelé ou quand il y a des mises à jour importantes.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {console.log('[Notifications] Rendering list with', notifications.length, 'items')}
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <View key={date} style={styles.section}>
                <Text style={styles.sectionTitle}>{date}</Text>
                <View style={styles.notificationsList}>
                  {notifs.map((notif, index) => {
                    const { icon, color, bgColor } = getNotificationStyle(notif.type);
                    const isUnread = !notif.read_at;
                    const isLast = index === notifs.length - 1;

                    return (
                      <TouchableOpacity
                        key={notif.id}
                        style={[
                          styles.notificationCard,
                          isUnread && styles.notificationCardUnread,
                          !isLast && styles.notificationCardBorder,
                        ]}
                        onPress={() => !notif.read_at && handleMarkAsRead(notif.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                          <Ionicons name={icon as any} size={22} color={color} />
                        </View>
                        
                        <View style={styles.notificationContent}>
                          <View style={styles.notificationHeader}>
                            <Text style={[styles.notificationTitle, isUnread && styles.notificationTitleUnread]}>
                              {notif.title}
                            </Text>
                            {isUnread && <View style={styles.unreadDot} />}
                          </View>
                          <Text style={styles.notificationMessage}>{notif.message}</Text>
                          <Text style={styles.notificationTime}>{formatRelativeTime(notif.created_at)}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(notif.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-outline" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={styles.bottomSpace} />
          </Animated.View>
        )}
      </ScrollView>
      {AlertComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markAllButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  markAllTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  placeholder: {
    width: 70,
  },
  unreadBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  notificationsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  notificationCardUnread: {
    backgroundColor: '#F8FAFC',
  },
  notificationCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  notificationTitleUnread: {
    color: '#1F2937',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
  },
  bottomSpace: {
    height: 40,
  },
});
