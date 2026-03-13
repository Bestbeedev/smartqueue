import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTicket } from '../../store/ticketStore';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Composant TicketsScreen
export const TicketsScreen: React.FC = () => {
  const {
    hasActiveTicket,
    activeTicket,
    position,
    etaMinutes,
    isAlmostThere,
    isCalled,
    error,
    fetchActiveTicket,
    cancelTicket,
  } = useTicket();
  const { AlertComponent, showWarning, showError } = useCustomAlert();
  
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);

  // Rafraîchir le ticket actif au montage pour s'assurer que les données sont à jour
  useEffect(() => {
    const refreshOnMount = async () => {
      try {
        await fetchActiveTicket();
      } catch (error) {
        console.error('Error fetching active ticket on mount:', error);
      }
    };
    refreshOnMount();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchActiveTicket();
    } catch (error) {
      console.error('Error refreshing ticket:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Annuler le ticket actif
  const handleCancelTicket = () => {
    if (!activeTicket) return;

    showWarning(
      'Annuler le ticket',
      'Êtes-vous sûr de vouloir annuler votre ticket ? Vous perdrez votre place dans la file.',
      'Oui, annuler',
      async () => {
        try {
          await cancelTicket(activeTicket.id);
        } catch (error) {
          console.error('Error canceling ticket:', error);
          showError('Erreur', 'Impossible d\'annuler le ticket. Veuillez réessayer.');
        }
      },
      'Non'
    );
  };

  // Navigation vers les différentes fonctionnalités
  const handleScanQR = () => {
    router.push('/(tabs)/scan');
  };

  const handleViewLiveTicket = () => {
    if (!activeTicket) return;
    router.push({
      pathname: '/(tabs)/live-ticket',
      params: { ticketId: String(activeTicket.id) },
    });
  };

  const handleViewHistory = () => {
    router.push('/(tabs)/history');
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  const getStatusColor = () => {
    if (isCalled) return ['#EF4444', '#DC2626'];
    if (isAlmostThere) return ['#F59E0B', '#D97706'];
    return ['#3B82F6', '#2563EB'];
  };

  const getStatusText = () => {
    if (isCalled) return 'APPELÉ';
    if (isAlmostThere) return 'BIENTÔT VOTRE TOUR';
    return 'EN ATTENTE';
  };

  // Rendu du ticket actif
  const renderActiveTicket = () => {
    if (!hasActiveTicket) {
      return (
        <Animated.View style={[styles.noTicketCard, { opacity: fadeAnim }]}>
          <View style={styles.noTicketContent}>
            <View style={styles.noTicketIconContainer}>
              <Ionicons name="ticket-outline" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.noTicketTitle}>
              Aucun ticket actif
            </Text>
            <Text style={styles.noTicketSubtitle}>
              Scannez un QR code ou rejoignez une file pour obtenir un ticket
            </Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.scanButtonGradient}
              >
                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scanner un QR code</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[styles.activeTicketCard, { opacity: fadeAnim }]}>
        {/* Status Banner */}
        <LinearGradient
          colors={getStatusColor() as [string, string]}
          style={styles.statusBanner}
        >
          <Ionicons name="time-outline" size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </LinearGradient>

        <View style={styles.ticketContent}>
          {/* Position */}
          <View style={styles.positionSection}>
            <Text style={styles.positionNumber}>{position}</Text>
            <Text style={styles.positionLabel}>ème position</Text>
          </View>

          {/* Ticket Info */}
          <View style={styles.ticketInfo}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="pricetag-outline" size={18} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Numéro</Text>
                <Text style={styles.infoValue}>{activeTicket?.number}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="briefcase-outline" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{activeTicket?.service?.name || 'Service'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="business-outline" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Établissement</Text>
                <Text style={styles.infoValue}>{activeTicket?.establishment?.name || 'Établissement'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="time-outline" size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Temps estimé</Text>
                <Text style={styles.infoValue}>{etaMinutes} min</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.ticketActions}>
            <TouchableOpacity style={styles.primaryAction} onPress={handleViewLiveTicket}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.primaryActionGradient}
              >
                <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Voir en direct</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dangerAction} onPress={handleCancelTicket}>
              <View style={styles.dangerActionContent}>
                <Ionicons name="close-outline" size={20} color="#EF4444" />
                <Text style={styles.dangerActionText}>Annuler le ticket</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Rendu des actions rapides
  const renderQuickActions = () => {
    const actions = [
      {
        id: 'scan',
        title: 'Scanner QR',
        icon: 'qr-code-outline',
        color: '#3B82F6',
        onPress: handleScanQR,
      },
      {
        id: 'history',
        title: 'Historique',
        icon: 'time-outline',
        color: '#10B981',
        onPress: handleViewHistory,
      },
      {
        id: 'map',
        title: 'Carte',
        icon: 'map-outline',
        color: '#D97706',
        onPress: () => router.push('/(tabs)'),
      },
    ];

    return (
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Rendu des statistiques
  const renderStats = () => {
    if (!hasActiveTicket) return null;

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{position}</Text>
            <Text style={styles.statLabel}>Position</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{etaMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{Math.max(0, position - 1)}</Text>
            <Text style={styles.statLabel}>Avant vous</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Ma File</Text>
            <Text style={styles.headerSubtitle}>Gérez vos tickets</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {hasActiveTicket && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Oups ! Une erreur est survenue</Text>
            <Text style={styles.errorSubtitle}>
              {error.includes('401') ? 'Votre session a expiré. Veuillez vous reconnecter.' : error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderActiveTicket()}
            {renderStats()}
            {renderQuickActions()}
          </>
        )}
        {AlertComponent}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  // No Ticket Card
  noTicketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  noTicketContent: {
    alignItems: 'center',
    padding: 32,
  },
  noTicketIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noTicketTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  noTicketSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Active Ticket Card
  activeTicketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  ticketContent: {
    padding: 24,
  },
  positionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  positionNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 80,
  },
  positionLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ticketInfo: {
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  ticketActions: {
    gap: 12,
  },
  primaryAction: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dangerAction: {
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
  },
  dangerActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Stats Section
  statsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  // Quick Actions
  quickActionsSection: {
    marginTop: 20,
    marginBottom:100,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Error
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 40,
  },
});

export default TicketsScreen;
