import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useUserStatsStore, Badge } from "../../store/userStatsStore";
import { LinearGradient } from "expo-linear-gradient";
import "../../../global.css";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
};

// Composant Stat Card compact
const StatCard: React.FC<{
  icon: string;
  value: string;
  label: string;
  color: string;
  colors: any;
}> = ({ icon, value, label, color, colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

// Composant Badge compact
const BadgeItem: React.FC<{ badge: Badge; colors: any }> = ({ badge, colors }) => {
  const isUnlocked = !!badge.unlockedAt;
  const progress = Math.min(100, (badge.progress / badge.maxProgress) * 100);

  return (
    <View style={[styles.badgeItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.badgeIcon, { backgroundColor: isUnlocked ? badge.color + "15" : colors.border + "30" }]}>
        <Ionicons name={badge.icon as any} size={20} color={isUnlocked ? badge.color : colors.textTertiary} />
      </View>
      <View style={styles.badgeInfo}>
        <View style={styles.badgeHeader}>
          <Text style={[styles.badgeName, { color: isUnlocked ? badge.color : colors.textPrimary }]}>{badge.name}</Text>
          {isUnlocked && <Ionicons name="checkmark-circle" size={14} color={badge.color} />}
        </View>
        <Text style={[styles.badgeDesc, { color: colors.textTertiary }]} numberOfLines={1}>{badge.description}</Text>
        {!isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: badge.color }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.textTertiary }]}>{badge.progress}/{badge.maxProgress}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Graphique hebdomadaire compact
const WeeklyChart: React.FC<{ data: number[]; colors: any }> = ({ data, colors }) => {
  const max = Math.max(...data, 1);
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.chartHeader}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>Activité de la semaine</Text>
      </View>
      <View style={styles.chartBars}>
        {data.map((value, index) => (
          <View key={index} style={styles.chartBarContainer}>
            <View style={[styles.chartBar, { height: `${(value / max) * 100}%`, backgroundColor: value > 0 ? colors.primary : colors.border, minHeight: value > 0 ? 3 : 2 }]} />
            <Text style={[styles.chartDay, { color: colors.textTertiary }]}>{days[index]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const colors = useThemeColors();
  const {
    currentLevel,
    xpPoints,
    nextLevelXp,
    totalTimeSavedMinutes,
    totalTicketsCreated,
    totalTicketsCompleted,
    totalDistanceKm,
    uniqueEstablishmentsVisited,
    badges,
    streakDays,
    weeklyActivity,
    getRankTitle,
    loadStatsFromBackend,
  } = useUserStatsStore();

  useFocusEffect(
    useCallback(() => {
      loadStatsFromBackend();
    }, [loadStatsFromBackend])
  );

  const rankTitle = getRankTitle();
  const xpProgress = Math.min(100, (xpPoints / nextLevelXp) * 100);
  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const lockedBadges = badges.filter((b) => !b.unlockedAt);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header compact avec niveau */}
      <View style={styles.header}>
        <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelNumber}>Niveau {currentLevel}</Text>
            <Text style={styles.rankTitle}>{rankTitle}</Text>
            <View style={styles.xpContainer}>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${xpProgress}%`, backgroundColor: "#FFF" }]} />
              </View>
              <Text style={styles.xpText}>{xpPoints} / {nextLevelXp} XP</Text>
            </View>
          </View>
          <View style={styles.levelBadge}>
            <Ionicons name="trophy" size={32} color="#FFF" />
          </View>
        </LinearGradient>

        {streakDays > 1 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.warning + "15" }]}>
            <Ionicons name="flame" size={16} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.warning }]}>Série de {streakDays} jours 🔥</Text>
          </View>
        )}
      </View>

      {/* Stats Grid compact */}
      <View style={styles.statsGrid}>
        <StatCard icon="hourglass-outline" value={formatDuration(totalTimeSavedMinutes)} label="Économisé" color="#10B981" colors={colors} />
        <StatCard icon="ticket-outline" value={String(totalTicketsCreated)} label="Tickets" color="#3B82F6" colors={colors} />
        <StatCard icon="checkmark-circle-outline" value={String(totalTicketsCompleted)} label="Complétés" color="#8B5CF6" colors={colors} />
        <StatCard icon="navigate-outline" value={`${Math.round(totalDistanceKm * 10) / 10} km`} label="Distance" color="#F59E0B" colors={colors} />
      </View>

      {/* Graphique hebdomadaire */}
      <WeeklyChart data={weeklyActivity} colors={colors} />

      {/* Établissements visités */}
      <View style={[styles.estabCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.estabHeader}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
          <Text style={[styles.estabTitle, { color: colors.textPrimary }]}>Établissements visités</Text>
        </View>
        <Text style={[styles.estabValue, { color: colors.primary }]}>{uniqueEstablishmentsVisited.length}</Text>
        <Text style={[styles.estabDesc, { color: colors.textTertiary }]}>établissements différents</Text>
      </View>

      {/* Badges Section compact */}
      <View style={styles.badgesSection}>
        <View style={styles.badgesHeader}>
          <Text style={[styles.badgesTitle, { color: colors.textPrimary }]}>Badges</Text>
          <View style={[styles.badgesCountBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.badgesCount, { color: colors.primary }]}>{unlockedBadges.length}/{badges.length}</Text>
          </View>
        </View>

        {unlockedBadges.length > 0 && (
          <View style={styles.badgesList}>
            <Text style={[styles.badgesSubtitle, { color: colors.success }]}>Débloqués</Text>
            {unlockedBadges.slice(0, 3).map((badge) => (
              <BadgeItem key={badge.type} badge={badge} colors={colors} />
            ))}
            {unlockedBadges.length > 3 && (
              <TouchableOpacity style={styles.moreBtn} onPress={() => {}}>
                <Text style={[styles.moreBtnText, { color: colors.primary }]}>+{unlockedBadges.length - 3} badges</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {lockedBadges.length > 0 && (
          <View style={styles.badgesList}>
            <Text style={[styles.badgesSubtitle, { color: colors.textTertiary }]}>En cours</Text>
            {lockedBadges.slice(0, 3).map((badge) => (
              <BadgeItem key={badge.type} badge={badge} colors={colors} />
            ))}
            {lockedBadges.length > 3 && (
              <TouchableOpacity style={styles.moreBtn} onPress={() => {}}>
                <Text style={[styles.moreBtnText, { color: colors.primary }]}>+{lockedBadges.length - 3} à débloquer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 55 : 40, paddingBottom: 16 },
  levelCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 20 },
  levelInfo: { flex: 1 },
  levelNumber: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 },
  rankTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginTop: 2 },
  xpContainer: { marginTop: 10 },
  xpBar: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  xpText: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  levelBadge: { width: 50, height: 50, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 25, alignItems: "center", justifyContent: "center" },
  streakBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 12, marginTop: 12, gap: 6 },
  streakText: { fontSize: 13, fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  statCard: { width: (SCREEN_WIDTH - 42) / 2, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  chartContainer: { marginHorizontal: 16, marginTop: 20, padding: 14, borderRadius: 16, borderWidth: 1 },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  chartTitle: { fontSize: 13, fontWeight: "500" },
  chartBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 70 },
  chartBarContainer: { alignItems: "center", flex: 1 },
  chartBar: { width: 22, borderRadius: 3 },
  chartDay: { fontSize: 11, marginTop: 4 },
  estabCard: { marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  estabHeader: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  estabTitle: { fontSize: 14, fontWeight: "600" },
  estabValue: { fontSize: 22, fontWeight: "700" },
  estabDesc: { fontSize: 11, marginLeft: 4 },
  badgesSection: { marginTop: 20, paddingHorizontal: 16 },
  badgesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badgesTitle: { fontSize: 17, fontWeight: "700" },
  badgesCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgesCount: { fontSize: 12, fontWeight: "700" },
  badgesList: { marginBottom: 16 },
  badgesSubtitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  badgeItem: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  badgeInfo: { flex: 1, marginLeft: 10 },
  badgeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeName: { fontSize: 13, fontWeight: "700" },
  badgeDesc: { fontSize: 11, marginTop: 2 },
  progressContainer: { marginTop: 4 },
  progressBar: { height: 3, borderRadius: 1.5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 1.5 },
  progressText: { fontSize: 9, marginTop: 2 },
  moreBtn: { paddingVertical: 8, alignItems: "center" },
  moreBtnText: { fontSize: 13, fontWeight: "600" },
});

export default DashboardScreen;