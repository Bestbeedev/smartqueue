import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTicket } from '../../store/ticketStore';
import { useTicketSocket } from '../../hooks/useTicketSocket';
import { useDistanceTracking } from '../../hooks/useDistanceTracking';
import { formatDistance, formatTravelTime } from '../../utils/distance';
import { CalledTicketOverlay } from '../../components/CalledTicketOverlay';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useThemeColors } from '../../hooks/useThemeColors';
import axiosClient from '../../api/axiosClient';

const { width } = Dimensions.get('window');

interface LiveTicketScreenProps {
  ticketId?: string;
}

export const LiveTicketScreen: React.FC<LiveTicketScreenProps> = ({ ticketId }) => {
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;
  const {
    activeTicket,
    position,
    etaMinutes,
    isAlmostThere,
    isCalled,
    cancelTicket,
    hasActiveTicket,
    hasRecalled,
    counterNumber,
    setRecalled,
    markAsCalled,
    fetchActiveTicket,
  } = useTicket();

  const { AlertComponent, showError, showSuccess, showWarning } = useCustomAlert();

  // Fetch fresh ticket data on mount
  useEffect(() => {
    fetchActiveTicket().catch(err => console.error('Error fetching ticket:', err));
  }, []);

  // Use activeTicket.id from store if ticketId prop is invalid
  const effectiveTicketId = useMemo(() => {
    const propId = ticketId ? Number(ticketId) : null;
    if (propId && !isNaN(propId)) return propId;
    return activeTicket?.id || null;
  }, [ticketId, activeTicket?.id]);

  // WebSocket connection
  useTicketSocket(effectiveTicketId?.toString() || null);
  
  // Check if establishment has valid coordinates
  const hasValidCoordinates = activeTicket?.establishment && 
    (activeTicket.establishment as any)?.lat !== null && 
    (activeTicket.establishment as any)?.lat !== undefined &&
    (activeTicket.establishment as any)?.lng !== null &&
    (activeTicket.establishment as any)?.lng !== undefined;
  
  // Distance tracking
  const { distanceInfo, hasPermission: hasLocationPermission } = useDistanceTracking({
    targetCoordinates: hasValidCoordinates ? {
      latitude: (activeTicket.establishment as any).lat,
      longitude: (activeTicket.establishment as any).lng,
    } : null,
    enabled: hasValidCoordinates && hasActiveTicket,
  });
  
  // Countdown state
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const positionAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation for live status
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Position animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(positionAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.spring(positionAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [position]);
  
  // Handle recall action
  const handleRecall = useCallback(async () => {
    if (!effectiveTicketId || hasRecalled) return;
    
    try {
      const response = await axiosClient.post(`/tickets/${effectiveTicketId}/recall`);
      setRecalled();
      setCountdownSeconds(response.data.countdown_seconds || 180);
    } catch (error: any) {
      showError('Erreur', error.response?.data?.error || 'Impossible d\'envoyer le rappel');
    }
  }, [effectiveTicketId, hasRecalled, setRecalled, showError]);
  
  // Handle "en route" action
  const handleEnRoute = useCallback(async () => {
    if (!effectiveTicketId) return;
    
    try {
      await axiosClient.post(`/tickets/${effectiveTicketId}/en-route`, {
        lat: distanceInfo ? null : undefined,
        lng: distanceInfo ? null : undefined,
        estimated_travel_minutes: distanceInfo?.travelTimes?.car,
      });
      showSuccess('Confirmation', 'L\'agent a été notifié que vous êtes en route');
    } catch (error: any) {
      showError('Erreur', error.response?.data?.error || 'Impossible de confirmer');
    }
  }, [effectiveTicketId, distanceInfo, showSuccess, showError]);
  
  // Handle dismiss
  const handleDismiss = useCallback(() => {
    return router.replace('/(tabs)');
  }, []);

  const handleCancelTicket = () => {
    showWarning(
      'Quitter la file ?',
      'Vous perdrez votre place dans la file d\'attente. Cette action est irréversible.',
      'Quitter',
      async () => {
        try {
          await cancelTicket(effectiveTicketId!);
          router.back();
        } catch {
          showError('Erreur', 'Impossible d\'annuler le ticket.');
        }
      },
      'Rester'
    );
  };

  const getOrdinal = (n: number): string => {
    if (n === 1) return '1er';
    return `${n}ème`;
  };

  const getStatusColor = () => {
    if (isCalled) return [colors.danger, colors.danger];
    if (position <= 3) return [colors.warning, colors.warning];
    return [colors.success, colors.success];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {AlertComponent}
      
      {/* Gradient Header */}
      <LinearGradient
        colors={isDark ? ['#1E3A5F', '#2563EB', '#3B82F6'] : [colors.primary, colors.secondary, '#1D4ED8']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Ma File</Text>
            <View style={[styles.liveBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.liveText, { color: '#FFFFFF' }]}>LIVE</Text>
            </View>
          </View>
          
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Ticket Card */}
        <Animated.View 
          style={[
            styles.ticketCard,
            { backgroundColor: colors.surface },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Status Banner */}
          <LinearGradient
            colors={getStatusColor() as [string, string]}
            style={styles.statusBanner}
          >
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
              {isCalled ? 'C\'est votre tour !' : position <= 3 ? 'Bientôt votre tour' : 'En attente'}
            </Text>
          </LinearGradient>

          {/* Ticket Info */}
          <View style={styles.ticketContent}>
            {/* QR Code */}
            <View style={styles.qrContainer}>
              <View style={[styles.qrBackground, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="qr-code" size={140} color={colors.textPrimary} />
              </View>
              <Text style={[styles.ticketNumber, { color: colors.textSecondary }]}>{activeTicket?.number || `TKT-${effectiveTicketId}`}</Text>
            </View>

            {/* Position Display */}
            <View style={styles.positionContainer}>
              <Text style={[styles.positionLabel, { color: colors.textTertiary }]}>Votre position</Text>
              <Animated.View style={{ transform: [{ scale: positionAnim }] }}>
                <Text style={[styles.positionNumber, { color: colors.textPrimary }]}>{getOrdinal(position)}</Text>
              </Animated.View>
              <Text style={[styles.positionSubtitle, { color: colors.textTertiary }]}>dans la file</Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="business-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Établissement</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activeTicket?.establishment?.name || 'Établissement'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="time-outline" size={20} color={colors.success} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Temps estimé</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{etaMinutes} min</Text>
              </View>
            </View>

            {/* Distance Info Card */}
            {hasValidCoordinates && distanceInfo && hasLocationPermission ? (
              <View style={[styles.distanceCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.distanceHeader}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={[styles.distanceTitle, { color: colors.primary }]}>Votre position</Text>
                </View>
                
                <View style={styles.distanceGrid}>
                  <View style={styles.distanceItem}>
                    <Ionicons name="navigate-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.distanceValue, { color: colors.textPrimary }]}>{formatDistance(distanceInfo.kilometers)}</Text>
                    <Text style={[styles.distanceLabel, { color: colors.textTertiary }]}>Distance</Text>
                  </View>
                  
                  <View style={[styles.distanceDivider, { backgroundColor: colors.separator }]} />
                  
                  <View style={styles.distanceItem}>
                    <Ionicons name="walk-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.distanceValue, { color: colors.textPrimary }]}>
                      {formatTravelTime(distanceInfo.travelTimes.walking)}
                    </Text>
                    <Text style={[styles.distanceLabel, { color: colors.textTertiary }]}>À pied</Text>
                  </View>
                  
                  <View style={[styles.distanceDivider, { backgroundColor: colors.separator }]} />
                  
                  <View style={styles.distanceItem}>
                    <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.distanceValue, { color: colors.textPrimary }]}>
                      {formatTravelTime(distanceInfo.travelTimes.car)}
                    </Text>
                    <Text style={[styles.distanceLabel, { color: colors.textTertiary }]}>Voiture</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.noCoordinatesCard, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="location-outline" size={24} color={colors.textTertiary} />
                <Text style={[styles.noCoordinatesText, { color: colors.textSecondary }]}>Coordonnées non disponibles</Text>
                <Text style={[styles.noCoordinatesSubtext, { color: colors.textTertiary }]}>
                  L'établissement n'a pas renseigné sa position GPS
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={[styles.primaryButton, { shadowColor: colors.primary }]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="navigate-circle-outline" size={22} color="#FFFFFF" />
              <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>Ouvrir Navigation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]}>
              <View style={[styles.secondaryButtonIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="wallet-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]}>
              <View style={[styles.secondaryButtonIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="share-outline" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]} onPress={handleCancelTicket}>
              <View style={[styles.secondaryButtonIcon, { backgroundColor: colors.danger + '15' }]}>
                <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Called Ticket Overlay */}
      <CalledTicketOverlay
        visible={isCalled}
        counterNumber={counterNumber || undefined}
        distanceInfo={distanceInfo}
        countdownSeconds={countdownSeconds}
        hasRecalled={hasRecalled}
        onEnRoute={handleEnRoute}
        onRecall={handleRecall}
        onDismiss={handleDismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  ticketCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
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
    fontSize: 14,
    fontWeight: '600',
  },
  ticketContent: {
    padding: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrBackground: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  positionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  positionLabel: {
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  positionNumber: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  positionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  distanceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  distanceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  distanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  distanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  distanceLabel: {
    fontSize: 12,
  },
  distanceDivider: {
    width: 1,
    height: 40,
  },
  noCoordinatesCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  noCoordinatesText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  noCoordinatesSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom:100,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LiveTicketScreen;
