import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { useTicket } from "../../store/ticketStore";
import type { Ticket } from "../../api/ticketsApi";
import { useCustomAlert } from "../../hooks/useCustomAlert";
import { useThemeColors } from "../../hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

// ── Pulsing skeleton ────────────────────────────────────────────────────────
const SkeletonBlock: React.FC<{ widthVal: number; height: number; borderRadius?: number; style?: any }> = ({
  widthVal, height, borderRadius = 8, style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width: widthVal, height, borderRadius, backgroundColor: "#CBD5E1", opacity }, style]}
    />
  );
};

const SkeletonCard: React.FC = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonRow}>
      <SkeletonBlock widthVal={60} height={14} />
      <SkeletonBlock widthVal={80} height={26} />
    </View>
    <SkeletonBlock widthVal="100%" height={40} borderRadius={12} style={{ marginBottom: 12 }} />
    <View style={styles.skeletonRow}>
      <SkeletonBlock widthVal="45%" height={14} />
      <SkeletonBlock widthVal="45%" height={14} />
    </View>
    <View style={[styles.skeletonRow, { marginTop: 12 }]}>
      <SkeletonBlock widthVal="48%" height={36} borderRadius={12} />
      <SkeletonBlock widthVal="48%" height={36} borderRadius={12} />
    </View>
  </View>
);

// Composant de statut compact - Version améliorée
const StatusBadge: React.FC<{ status: string; colors: any }> = ({ status, colors }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "present":
        return { label: "Présent", icon: "checkmark-circle", color: colors.success };
      case "en_route":
        return { label: "En route", icon: "walk", color: colors.warning };
      case "called":
        return { label: "Appelé", icon: "notifications", color: colors.danger };
      default:
        return { label: "En attente", icon: "time", color: colors.primary };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.color + "18", borderColor: config.color + "40" }]}>
      <Ionicons name={config.icon as any} size={13} color={config.color} />
      <Text style={[styles.statusBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

// Mini cercle de progression SVG (inspiré de LiveTicketScreen)
const MiniProgressCircle: React.FC<{
  position: number;
  maxPosition: number;
  isSoon: boolean;
  color: string;
  colors: any;
}> = ({ position, maxPosition, isSoon, color, colors }) => {
  const size = 64;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, position / Math.max(1, maxPosition));
  const filledLength = circumference * ratio;
  const gapLength = circumference - filledLength;

  return (
    <View style={styles.miniCircleOuter}>
      <View style={styles.miniCircleWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${filledLength} ${gapLength}`}
            strokeDashoffset={0}
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.miniCircleCenter}>
          <Text style={[styles.miniCircleValue, { color }]}>
            {position > 0 ? position : "—"}
          </Text>
        </View>
      </View>
      {isSoon && (
        <Text style={[styles.miniCircleSoon, { color: colors.warning }]}>⚡ Bientôt</Text>
      )}
    </View>
  );
};

// Carte de progression compacte
const ProgressCard: React.FC<{
  position: number;
  etaMinutes: number;
  colors: any;
}> = ({ position, etaMinutes, colors }) => {
  const maxPos = Math.max(3, position);
  const isSoon = position > 0 && position <= 3;
  const posColor = position <= 2 ? colors.danger : position <= 5 ? colors.warning : colors.primary;

  return (
    <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.progressRow}>
        <MiniProgressCircle
          position={position}
          maxPosition={maxPos}
          isSoon={isSoon}
          color={posColor}
          colors={colors}
        />
        <View style={styles.progressInfoCol}>
          <Text style={[styles.progressInfoLabel, { color: colors.textTertiary }]}>Temps estimé</Text>
          <Text style={[styles.progressInfoEta, { color: posColor }]}>
            {etaMinutes > 0 ? `${etaMinutes}` : "—"} min
          </Text>
          {position > 0 && (
            <Text style={[styles.progressInfoPeople, { color: colors.textTertiary }]}>
              {position - 1} personne{(position - 1) > 1 ? "s" : ""} devant vous
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Carte de ticket secondaire compacte - CORRIGÉE
const TicketCard: React.FC<{
  ticket: Ticket;
  colors: any;
  onPress?: () => void;
}> = ({ ticket, colors, onPress }) => {
  const getQueueInfo = () => {
    if (ticket.status === "called") return "Appelé";
    if (ticket.status === "present") return "Présent";
    if (ticket.status === "en_route") return "En route";
    if (ticket.position && ticket.position > 0) return `${ticket.position}e place`;
    return "En attente";
  };

  return (
    <TouchableOpacity 
      style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.ticketCardLeft}>
        <View style={[styles.ticketNumberBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.ticketNumber, { color: colors.primary }]} numberOfLines={1}>
            {ticket.number}
          </Text>
        </View>
        <View style={styles.ticketDetails}>
          <Text style={[styles.ticketService, { color: colors.textPrimary }]} numberOfLines={1}>
            {ticket.service?.name || "Service"}
          </Text>
          <Text style={[styles.ticketQueueInfo, { color: colors.textTertiary }]} numberOfLines={1}>
            {getQueueInfo()}
          </Text>
        </View>
      </View>
      <StatusBadge status={ticket.status} colors={colors} />
    </TouchableOpacity>
  );
};

// Action rapide en carte
const QuickActionCard: React.FC<{
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.quickActionCard, { borderColor: color + "25" }]}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    activeOpacity={0.8}
  >
    <View style={[styles.quickActionCardIcon, { backgroundColor: color + "12" }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={[styles.quickActionCardLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// Composant principal
export const TicketsScreen: React.FC = () => {
  const colors = useThemeColors();
  const {
    hasActiveTicket,
    activeTicket,
    activeTickets,
    position,
    etaMinutes,
    isCalled,
    error,
    fetchActiveTicket,
    cancelTicket,
  } = useTicket();
  const { AlertComponent, showWarning, showError } = useCustomAlert();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const otherActiveTickets = useMemo(
    () => activeTickets.filter((ticket) => ticket.id !== activeTicket?.id),
    [activeTickets, activeTicket?.id],
  );

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchActiveTicket()
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, [fetchActiveTicket]),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchActiveTicket(); } finally { setRefreshing(false); }
  }, [fetchActiveTicket]);

  const handleCancelTicket = useCallback(() => {
    if (!activeTicket) return;
    showWarning("Annuler le ticket", "Vous perdrez votre place dans la file", "Annuler", async () => {
      try { await cancelTicket(activeTicket.id); } 
      catch (error: any) { showError("Erreur", error?.message || "Impossible d'annuler"); }
    }, "Retour");
  }, [activeTicket, cancelTicket, showWarning, showError]);

  const handleScanQR = useCallback(() => router.push("/(tabs)/scan"), []);
  const handleViewLiveTicket = useCallback(() => {
    if (!activeTicket) return;
    router.push({ pathname: "/(tabs)/live-ticket", params: { ticketId: String(activeTicket.id) } });
  }, [activeTicket]);
  const handleViewHistory = useCallback(() => router.push("/(tabs)/history"), []);
  const handleNotifications = useCallback(() => router.push("/notifications"), []);

  const renderHeader = () => (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.welcomeText}>👋 Aperçu de votre</Text>
          <Text style={styles.headerTitle}>File d'attente</Text>
        </View>
        <View style={styles.headerRight}>
          {hasActiveTicket && (
            <View style={styles.liveDotWrap}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={styles.liveDotText}>LIVE</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.notificationIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
            {hasActiveTicket && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[colors.primary + "20", colors.secondary + "10"]}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="ticket-outline" size={56} color={colors.primary} />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Pas de ticket actif</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Scannez un QR code dans un établissement pour rejoindre une file d'attente
      </Text>
      <TouchableOpacity style={styles.scanButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleScanQR(); }}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.scanButtonGradient}>
          <Ionicons name="qr-code-outline" size={18} color="#FFF" />
          <Text style={styles.scanButtonText}>Scanner un QR code</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderActiveTicket = () => {
    // Déterminer si on affiche la position ou le statut
    const isSpecialStatus = activeTicket?.status === "called" || activeTicket?.status === "present" || activeTicket?.status === "en_route";
    const queueLength = (activeTicket as any)?.queue_length || position || 1;
    
    const displayText = isSpecialStatus 
      ? (activeTicket?.status === "called" ? "Appelé" : activeTicket?.status === "present" ? "Présent" : "En route")
      : `${position}e / ${queueLength}`;
    const displayLabel = isSpecialStatus ? "Statut" : "Position";

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={[styles.mainTicketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.ticketHeader}>
            <View>
              <Text style={[styles.ticketLabel, { color: colors.textTertiary }]}>Votre ticket</Text>
              <Text style={[styles.ticketNumber, { color: colors.primary }]}>{activeTicket?.number}</Text>
            </View>
            <StatusBadge status={activeTicket?.status || "waiting"} colors={colors} />
          </View>

          <View style={styles.ticketInfoCompact}>
            <View style={styles.ticketInfoItem}>
              <Ionicons name="business-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.ticketInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
                {activeTicket?.establishment?.name || "Établissement"}
              </Text>
            </View>
            <View style={styles.ticketInfoItem}>
              <Ionicons name="briefcase-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.ticketInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
                {activeTicket?.service?.name || "Service"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRowCompact}>
            <View style={styles.statItemCompact}>
              <Text style={[styles.statLabelCompact, { color: colors.textTertiary }]}>{displayLabel}</Text>
              <Text style={[styles.statValueCompact, { color: isSpecialStatus ? colors.primary : colors.primary }]}>{displayText}</Text>
            </View>
            <View style={[styles.statDividerCompact, { backgroundColor: colors.border }]} />
            <View style={styles.statItemCompact}>
              <Text style={[styles.statLabelCompact, { color: colors.textTertiary }]}>Estimation</Text>
              <Text style={[styles.statValueCompact, { color: colors.primary }]}>{etaMinutes > 0 ? `${etaMinutes} min` : "—"}</Text>
            </View>
          </View>

          <View style={styles.ticketActionsCompact}>
            <TouchableOpacity style={[styles.actionBtnCompact, { backgroundColor: colors.primary + "10" }]} onPress={handleViewLiveTicket}>
              <Ionicons name="eye-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnTextCompact, { color: colors.primary }]}>Suivre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtnCompact, { backgroundColor: colors.danger + "10" }]} onPress={handleCancelTicket}>
              <Ionicons name="close-outline" size={18} color={colors.danger} />
              <Text style={[styles.actionBtnTextCompact, { color: colors.danger }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTicket?.status === "waiting" && <ProgressCard position={position} etaMinutes={etaMinutes} colors={colors} />}
        
        {activeTicket?.status === "called" && (
          <View style={[styles.specialStatusCard, { backgroundColor: colors.danger + "10", borderColor: colors.danger }]}>
            <Ionicons name="notifications" size={20} color={colors.danger} />
            <Text style={[styles.specialStatusText, { color: colors.danger }]}>Appelé au guichet !</Text>
          </View>
        )}
        {activeTicket?.status === "present" && (
          <View style={[styles.specialStatusCard, { backgroundColor: colors.success + "10", borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.specialStatusText, { color: colors.success }]}>Présent - Priorité conservée</Text>
          </View>
        )}
        {activeTicket?.status === "en_route" && (
          <View style={[styles.specialStatusCard, { backgroundColor: colors.warning + "10", borderColor: colors.warning }]}>
            <Ionicons name="walk" size={20} color={colors.warning} />
            <Text style={[styles.specialStatusText, { color: colors.warning }]}>En route - Agent notifié</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderOtherTickets = () => {
    if (!hasActiveTicket || otherActiveTickets.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Autres tickets</Text>
          <View style={[styles.sectionBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>{otherActiveTickets.length}</Text>
          </View>
        </View>
        {otherActiveTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            colors={colors}
            onPress={() => router.push({
              pathname: "/(tabs)/live-ticket",
              params: { ticketId: String(ticket.id) },
            })}
          />
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Actions Rapides</Text>
      <View style={styles.quickActionsGrid}>
        <QuickActionCard icon="qr-code-outline" label="Scanner" color={colors.primary} onPress={handleScanQR} />
        <QuickActionCard icon="time-outline" label="Historique" color={colors.success} onPress={handleViewHistory} />
        <QuickActionCard icon="map-outline" label="Carte" color={colors.warning} onPress={() => router.push("/navigation")} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <SkeletonCard />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>Une erreur est survenue</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {hasActiveTicket ? renderActiveTicket() : renderEmptyState()}
            {renderOtherTickets()}
            {renderQuickActions()}
          </>
        )}
        {AlertComponent}
        <View style={styles.bottomSpace} />
      </ScrollView>
      {!isLoading && !hasActiveTicket && !error && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleScanQR}>
          <Ionicons name="qr-code" size={26} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 55 : 35, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  welcomeText: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  liveDotWrap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)" },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveDotText: { fontSize: 9, fontWeight: "800", color: "#FFF", letterSpacing: 1 },
  notificationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  notificationDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonCard: { borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0", padding: 16, marginBottom: 16, gap: 12 },
  skeletonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 28, paddingHorizontal: 30, lineHeight: 20 },
  scanButton: { borderRadius: 14, overflow: "hidden" },
  scanButtonGradient: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 24, gap: 6 },
  scanButtonText: { fontSize: 14, fontWeight: "600", color: "#FFF" },

  // ── Main Ticket ───────────────────────────────────────────────────────────
  mainTicketCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  ticketLabel: { fontSize: 11, marginBottom: 2 },
  ticketNumber: { fontSize: 22, fontWeight: "800" },
  ticketInfoCompact: { gap: 8, marginBottom: 12 },
  ticketInfoItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketInfoText: { fontSize: 13, flex: 1 },
  statsRowCompact: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statItemCompact: { flex: 1, alignItems: "center" },
  statLabelCompact: { fontSize: 10, marginBottom: 2 },
  statValueCompact: { fontSize: 16, fontWeight: "700" },
  statDividerCompact: { width: 1, height: 30 },
  ticketActionsCompact: { flexDirection: "row", gap: 10 },
  actionBtnCompact: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  actionBtnTextCompact: { fontSize: 13, fontWeight: "600" },

  // ── Progress Card (mini circle) ───────────────────────────────────────────
  progressCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  progressInfoCol: { flex: 1, gap: 2 },
  progressInfoLabel: { fontSize: 12, fontWeight: "500" },
  progressInfoEta: { fontSize: 26, fontWeight: "800" },
  progressInfoPeople: { fontSize: 12, marginTop: 2 },

  miniCircleOuter: { alignItems: "center" },
  miniCircleWrap: { alignItems: "center", justifyContent: "center" },
  miniCircleCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  miniCircleValue: { fontSize: 18, fontWeight: "800" },
  miniCircleSoon: { fontSize: 8, fontWeight: "700", marginTop: 2 },

  // ── Special Status ────────────────────────────────────────────────────────
  specialStatusCard: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
  specialStatusText: { fontSize: 14, fontWeight: "600" },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  sectionBadgeText: { fontSize: 13, fontWeight: "700" },

  // ── Ticket Card (secondary) ───────────────────────────────────────────────
  ticketCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  ticketCardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  ticketNumberBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignItems: "center", justifyContent: "center", minWidth: 60 },
  ticketNumber: { fontSize: 16, fontWeight: "800" as any, textAlign: "center" },
  ticketDetails: { flex: 1 },
  ticketService: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  ticketQueueInfo: { fontSize: 11 },

  // ── Status Badge ──────────────────────────────────────────────────────────
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  // ── Quick Actions (cards) ─────────────────────────────────────────────────
  quickActionsGrid: { flexDirection: "row", gap: 10, marginTop: 10 },
  quickActionCard: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  quickActionCardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickActionCardLabel: { fontSize: 12, fontWeight: "600" },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorContainer: { alignItems: "center", paddingVertical: 50 },
  errorText: { fontSize: 15, marginTop: 14, marginBottom: 20 },
  retryButton: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 12 },
  retryButtonText: { color: "#FFF", fontSize: 13, fontWeight: "600" },

  // ── Misc ──────────────────────────────────────────────────────────────────
  fab: { position: "absolute", bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  bottomSpace: { height: 20 },
});

export default TicketsScreen;