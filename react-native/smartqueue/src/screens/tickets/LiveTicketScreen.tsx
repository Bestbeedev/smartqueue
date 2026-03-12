import React, { useEffect, useRef, useState, useCallback } from "react";
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
import axiosClient from '../../api/axiosClient';

const { width } = Dimensions.get('window');

interface LiveTicketScreenProps {
  ticketId?: string;
}

export const LiveTicketScreen: React.FC<LiveTicketScreenProps> = ({ ticketId }) => {
  const numericTicketId = ticketId ? Number(ticketId) : null;

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
  } = useTicket();

  const { AlertComponent, showError, showSuccess, showWarning } = useCustomAlert();

  // WebSocket connection
  useTicketSocket(numericTicketId?.toString() || null);
  
  // Distance tracking
  const { distanceInfo, hasPermission: hasLocationPermission } = useDistanceTracking({
    targetCoordinates: activeTicket?.establishment ? {
      latitude: (activeTicket.establishment as any).lat || 0,
      longitude: (activeTicket.establishment as any).lng || 0,
    } : null,
    enabled: !!activeTicket?.establishment && hasActiveTicket,
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
    if (!numericTicketId || hasRecalled) return;
    
    try {
      const response = await axiosClient.post(`/tickets/${numericTicketId}/recall`);
      setRecalled();
      setCountdownSeconds(response.data.countdown_seconds || 180);
    } catch (error: any) {
      showError('Erreur', error.response?.data?.error || 'Impossible d\'envoyer le rappel');
    }
  }, [numericTicketId, hasRecalled, setRecalled, showError]);
  
  // Handle "en route" action
  const handleEnRoute = useCallback(async () => {
    if (!numericTicketId) return;
    
    try {
      await axiosClient.post(`/tickets/${numericTicketId}/en-route`, {
        lat: distanceInfo ? null : undefined,
        lng: distanceInfo ? null : undefined,
        estimated_travel_minutes: distanceInfo?.travelTimes?.car,
      });
      showSuccess('Confirmation', 'L\'agent a été notifié que vous êtes en route');
    } catch (error: any) {
      showError('Erreur', error.response?.data?.error || 'Impossible de confirmer');
    }
  }, [numericTicketId, distanceInfo, showSuccess, showError]);
  
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
          await cancelTicket(numericTicketId!);
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
    if (isCalled) return ['#EF4444', '#DC2626'];
    if (position <= 3) return ['#F59E0B', '#D97706'];
    return ['#10B981', '#059669'];
  };

  return (
    <View style={styles.container}>
      {AlertComponent}
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Ma File</Text>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
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
            <Text style={styles.statusText}>
              {isCalled ? 'C\'est votre tour !' : position <= 3 ? 'Bientôt votre tour' : 'En attente'}
            </Text>
          </LinearGradient>

          {/* Ticket Info */}
          <View style={styles.ticketContent}>
            {/* QR Code */}
            <View style={styles.qrContainer}>
              <View style={styles.qrBackground}>
                <Ionicons name="qr-code" size={140} color="#1F2937" />
              </View>
              <Text style={styles.ticketNumber}>{activeTicket?.number || `TKT-${numericTicketId}`}</Text>
            </View>

            {/* Position Display */}
            <View style={styles.positionContainer}>
              <Text style={styles.positionLabel}>Votre position</Text>
              <Animated.View style={{ transform: [{ scale: positionAnim }] }}>
                <Text style={styles.positionNumber}>{getOrdinal(position)}</Text>
              </Animated.View>
              <Text style={styles.positionSubtitle}>dans la file</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="business-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.infoLabel}>Établissement</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {activeTicket?.establishment?.name || 'Établissement'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="time-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.infoLabel}>Temps estimé</Text>
                <Text style={styles.infoValue}>{etaMinutes} min</Text>
              </View>
            </View>

            {/* Distance Info Card */}
            {distanceInfo && hasLocationPermission && (
              <View style={styles.distanceCard}>
                <View style={styles.distanceHeader}>
                  <Ionicons name="location-outline" size={18} color="#3B82F6" />
                  <Text style={styles.distanceTitle}>Votre position</Text>
                </View>
                
                <View style={styles.distanceGrid}>
                  <View style={styles.distanceItem}>
                    <Ionicons name="navigate-outline" size={20} color="#6B7280" />
                    <Text style={styles.distanceValue}>{formatDistance(distanceInfo.kilometers)}</Text>
                    <Text style={styles.distanceLabel}>Distance</Text>
                  </View>
                  
                  <View style={styles.distanceDivider} />
                  
                  <View style={styles.distanceItem}>
                    <Ionicons name="walk-outline" size={20} color="#6B7280" />
                    <Text style={styles.distanceValue}>
                      {formatTravelTime(distanceInfo.travelTimes.walking)}
                    </Text>
                    <Text style={styles.distanceLabel}>À pied</Text>
                  </View>
                  
                  <View style={styles.distanceDivider} />
                  
                  <View style={styles.distanceItem}>
                    <Ionicons name="car-outline" size={20} color="#6B7280" />
                    <Text style={styles.distanceValue}>
                      {formatTravelTime(distanceInfo.travelTimes.car)}
                    </Text>
                    <Text style={styles.distanceLabel}>Voiture</Text>
                  </View>
                </View>
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
          <TouchableOpacity style={styles.primaryButton}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="navigate-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ouvrir Navigation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton}>
              <View style={styles.secondaryButtonIcon}>
                <Ionicons name="wallet-outline" size={20} color="#1F2937" />
              </View>
              <Text style={styles.secondaryButtonText}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <View style={[styles.secondaryButtonIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="share-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.secondaryButtonText}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelTicket}>
              <View style={[styles.secondaryButtonIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.secondaryButtonText, { color: '#EF4444' }]}>Annuler</Text>
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginTop: -20,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  ticketContent: {
    padding: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrBackground: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 2,
  },
  positionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  positionLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  positionNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 80,
  },
  positionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
    color: '#9CA3AF',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  distanceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#3B82F6',
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
    color: '#1F2937',
    marginTop: 6,
    marginBottom: 2,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  distanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
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
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
});

export default LiveTicketScreen;
