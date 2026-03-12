import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTicket } from "../store/ticketStore";
import { useDistanceTracking } from "../hooks/useDistanceTracking";
import { useAlertPreferencesStore } from "../store/alertPreferencesStore";
import { useCustomAlert } from "../hooks/useCustomAlert";
import {
  formatDistance,
  formatTravelTime,
} from "../utils/distance";
import "../../global.css";
import axiosClient from "../api/axiosClient";

interface ActiveTicketCardProps {
  onPress?: () => void;
  onCancel?: () => void;
  onConfirmPresence?: () => void;
}

export const ActiveTicketCard: React.FC<ActiveTicketCardProps> = ({
  onPress,
  onCancel,
  onConfirmPresence,
}) => {
  const {
    activeTicket,
    position,
    etaMinutes,
    isCalled,
    counterNumber,
    hasRecalled,
    setRecalled,
    clearActiveTicket,
  } = useTicket();

  const { marginMinutes, preferredTransportMode } = useAlertPreferencesStore();
  const { AlertComponent, showWarning, showError, showInfo } = useCustomAlert();

  // Distance tracking
  const { distanceInfo } = useDistanceTracking({
    targetCoordinates: activeTicket?.establishment
      ? {
          latitude: (activeTicket.establishment as any).lat || 0,
          longitude: (activeTicket.establishment as any).lng || 0,
        }
      : null,
    enabled: !!activeTicket?.establishment,
  });

  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Queue length (from ticket or default)
  const queueLength = (activeTicket as any)?.queue_length || 18;
  const processedCount = Math.max(0, queueLength - position);

  // Calculate when to leave
  const getWhenToLeave = useCallback(() => {
    if (!distanceInfo) return null;

    const travelTime = distanceInfo.travelTimes[preferredTransportMode];
    const leaveIn = etaMinutes - travelTime - marginMinutes;

    if (leaveIn <= 0) {
      return { urgent: true, message: "Partez maintenant !" };
    } else if (leaveIn <= 5) {
      return { urgent: true, message: `Partez dans ~${leaveIn} min` };
    }
    return {
      urgent: false,
      message: `Vous devriez partir dans ~${leaveIn} min`,
    };
  }, [distanceInfo, etaMinutes, marginMinutes, preferredTransportMode]);

  const whenToLeave = getWhenToLeave();

  // Progress bar animation
  useEffect(() => {
    const progress = queueLength > 0 ? processedCount / queueLength : 0;
    Animated.spring(progressAnim, {
      toValue: progress,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [processedCount, queueLength, progressAnim]);

  // Called state animations (pulsing red)
  useEffect(() => {
    if (isCalled) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [isCalled, pulseAnim]);

  // Handle cancel ticket
  const handleCancel = useCallback(() => {
    showWarning(
      "Annuler le ticket",
      "Êtes-vous sûr de vouloir annuler votre ticket ?",
      "Oui, annuler",
      async () => {
        try {
          if (activeTicket?.id) {
            await axiosClient.delete(`/tickets/${activeTicket.id}`);
          }
          clearActiveTicket();
          onCancel?.();
        } catch (error: any) {
          showError("Erreur", "Impossible d'annuler le ticket");
        }
      },
      "Non"
    );
  }, [activeTicket, clearActiveTicket, onCancel, showWarning, showError]);

  // Handle confirm presence
  const handleConfirmPresence = useCallback(async () => {
    try {
      await axiosClient.post(`/tickets/${activeTicket?.id}/en-route`, {
        estimated_travel_minutes:
          distanceInfo?.travelTimes?.[preferredTransportMode],
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onConfirmPresence?.();
    } catch (error: any) {
      showError("Erreur", "Impossible de confirmer");
    }
  }, [activeTicket, distanceInfo, preferredTransportMode, onConfirmPresence, showError]);

  // Handle recall
  const handleRecall = useCallback(async () => {
    if (hasRecalled) {
      showInfo("Info", "Le rappel a déjà été utilisé");
      return;
    }

    try {
      await axiosClient.post(`/tickets/${activeTicket?.id}/recall`);
      setRecalled();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error: any) {
      showError(
        "Erreur",
        error.response?.data?.error || "Impossible d'envoyer le rappel"
      );
    }
  }, [activeTicket, hasRecalled, setRecalled, showInfo, showError]);

  if (!activeTicket) return null;

  // Called state - dramatic transformation
  if (isCalled) {
    return (
      <>
        {AlertComponent}
        <Animated.View
          style={[styles.calledContainer, { transform: [{ scale: pulseAnim }] }]}
        >
        <View style={styles.calledContent}>
          <Animated.View
            style={[styles.calledIcon, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons name="notifications" size={48} color="white" />
          </Animated.View>

          <Text style={styles.calledTitle}>C&apos;EST VOTRE TOUR</Text>

          {counterNumber && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>Guichet {counterNumber}</Text>
            </View>
          )}

          <Text style={styles.calledSubtext}>Présentez-vous au guichet</Text>
        </View>

        <View
          className="flex-wrap flex-col justify-between gap-2"
          style={styles.calledActions}
        >
          <TouchableOpacity
            className="w-full"
            style={styles.confirmButton}
            onPress={handleConfirmPresence}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.confirmButtonText}>
              Je confirme ma présence
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recallButton}
            onPress={handleRecall}
            disabled={hasRecalled}
            activeOpacity={0.8}
          >
            <Ionicons
              name={hasRecalled ? "checkmark-done" : "refresh"}
              size={20}
              color="white"
            />
            <Text style={styles.recallButtonText}>
              {hasRecalled ? "Rappel envoyé" : "Me rappeler"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButtonSmall}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
    );
  }

  // Normal state
  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.establishmentInfo}>
            <Ionicons name="business" size={18} color="#3B82F6" />
            <Text style={styles.establishmentName}>
              {activeTicket.establishment?.name || "Établissement"}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>File ouverte</Text>
          </View>
        </View>

        {/* Ticket Info */}
        <View style={styles.ticketSection}>
          <View style={styles.ticketNumberContainer}>
            <Text style={styles.ticketLabel}>VOTRE TICKET</Text>
            <View style={styles.ticketNumberBox}>
              <Text style={styles.ticketNumber}>
                N°{activeTicket.number?.split("-").pop() || position}
              </Text>
            </View>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>
              {activeTicket.service?.name || "Service"}
            </Text>
            <Text style={styles.ticketTime}>
              Pris à{" "}
              {new Date(activeTicket.created_at || Date.now()).toLocaleTimeString(
                "fr-FR",
                { hour: "2-digit", minute: "2-digit" },
              )}
            </Text>
          </View>
        </View>

        {/* Position & ETA */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Position dans la file</Text>
            <Text style={styles.statValue}>
              <Text style={styles.statHighlight}>{position}ème</Text> /{" "}
              {queueLength}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Temps d&apos;attente estimé</Text>
            <Text style={styles.statValue}>
              ≈ <Text style={styles.statHighlight}>{etaMinutes}</Text> minutes
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {processedCount} / {queueLength} traités
          </Text>
        </View>

        {/* Distance Block */}
        {distanceInfo && (
          <View style={styles.distanceGrid}>
            {[
              {
                icon: "navigate",
                label: "Distance",
                value: formatDistance(distanceInfo.kilometers),
              },
              {
                icon: "walk",
                label: "À pied",
                value: formatTravelTime(distanceInfo.travelTimes.walking),
              },
              {
                icon: "bicycle",
                label: "Moto",
                value: formatTravelTime(distanceInfo.travelTimes.motorcycle),
              },
              {
                icon: "car",
                label: "Voiture",
                value: formatTravelTime(distanceInfo.travelTimes.car),
              },
            ].map((item, index) => (
              <View key={index} style={styles.distanceCard}>
                <Ionicons name={item.icon as any} size={24} color="#6B7280" />
                <Text style={styles.distanceValue}>{item.value}</Text>
                <Text style={styles.distanceLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* When to Leave Alert */}
        {whenToLeave && (
          <View
            style={[
              styles.leaveAlert,
              whenToLeave.urgent && styles.leaveAlertUrgent,
            ]}
          >
            <Ionicons
              name={whenToLeave.urgent ? "warning" : "time"}
              size={16}
              color={whenToLeave.urgent ? "#DC2626" : "#F59E0B"}
            />
            <Text
              style={[
                styles.leaveText,
                whenToLeave.urgent && styles.leaveTextUrgent,
              ]}
            >
              {whenToLeave.message}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.confirmPresenceButton}
            onPress={handleConfirmPresence}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            <Text style={styles.confirmPresenceText}>Je suis présent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelTicketButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={18} color="#EF4444" />
            <Text style={styles.cancelTicketText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {AlertComponent}
    </>
  );
};

const styles = StyleSheet.create({
  // Normal state
  container: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  establishmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  establishmentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  ticketSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ticketNumberContainer: {
    alignItems: "center",
  },
  ticketLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 6,
  },
  ticketNumberBox: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  serviceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  ticketTime: {
    fontSize: 13,
    color: "#6B7280",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  statHighlight: {
    fontWeight: "700",
    color: "#3B82F6",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
  },
  distanceRow: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  distanceItem: {
    flexDirection: "column",
    alignItems: "center",
  },
  // distanceValue: {
  //   fontSize: 14,
  //   fontWeight: '600',
  //   color: '#374151',
  //   marginLeft: 4,
  // },
  leaveAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  leaveAlertUrgent: {
    backgroundColor: "#FEE2E2",
  },
  leaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B45309",
    marginLeft: 8,
  },
  leaveTextUrgent: {
    color: "#DC2626",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  confirmPresenceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmPresenceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
    marginLeft: 6,
  },
  cancelTicketButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelTicketText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 6,
  },

  // Called state
  calledContainer: {
    backgroundColor: "#DC2626",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  calledContent: {
    alignItems: "center",
    marginBottom: 24,
  },
  calledIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  calledTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    letterSpacing: 1,
  },
  counterBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  counterText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  calledSubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 12,
  },
  calledActions: {
    gap: 12,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
    marginLeft: 8,
  },
  recallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  recallButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  cancelButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginLeft: 6,
  },
  distanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  distanceCard: {
    backgroundColor: "white",
    width: "48%", // deux cartes par ligne
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  distanceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
});

export default ActiveTicketCard;
