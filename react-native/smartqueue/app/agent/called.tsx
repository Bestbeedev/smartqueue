import React, { useCallback, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useAuth } from "../../src/store/authStore";
import axiosClient from "../../src/api/axiosClient";
import { useFocusEffect } from "@react-navigation/native";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

(window as any).Pusher = Pusher;

type Ticket = {
  id: number;
  number: string;
  status: string;
  called_at: string | null;
  created_at: string;
  en_route_at?: string | null;
  present_at?: string | null;
  response_received_at?: string | null;
  en_route_expires_at?: string | null;
  estimated_travel_minutes?: number | null;
  absent_level?: number;
  absent_expires_at?: string | null;
  max_call_attempts?: number;
};

// Visual config per status
const STATUS_CONFIG = {
  called: {
    color: "#22C55E",
    label: "Appelé",
    icon: "megaphone" as const,
  },
  en_route: {
    color: "#FF9500",
    label: "En route 🚗",
    icon: "car" as const,
  },
  present: {
    color: "#3B82F6",
    label: "Présent ✓",
    icon: "checkmark-circle" as const,
  },
} as const;

const getStatusCfg = (status: string) =>
  STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.called;

export default function CalledTickets() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ serviceId: string }>();

  const assignedServices = (user as any)?.services || [];
  const serviceId =
    params.serviceId ||
    (assignedServices.length > 0
      ? assignedServices[0].id.toString()
      : undefined);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const echoRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    if (!serviceId) {
      setIsLoading(false);
      return;
    }
    try {
      const resp = await axiosClient.get(
        `/services/${parseInt(serviceId)}/queue`,
      );
      const all = resp.data?.tickets || resp.data || [];
      const filtered = Array.isArray(all)
        ? all.filter((t: any) =>
            ["called", "en_route", "present"].includes(t.status),
          )
        : [];
      setTickets(filtered);
    } catch {
      try {
        const response = await axiosClient.get("/agent/tickets", {
          params: {
            service_id: parseInt(serviceId),
            status: "called,en_route,present",
            per_page: 50,
          },
        });
        setTickets(response.data?.data || []);
      } catch (e) {
        console.error("Error fetching called tickets (fallback):", e);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [serviceId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // WebSocket real-time
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const connectRealtime = async () => {
        if (!serviceId || echoRef.current) return;
        const token = await AsyncStorage.getItem("access_token");
        if (!token) return;

        const wsUrlStr =
          process.env.EXPO_PUBLIC_WS_URL ||
          "wss://reverb-production-b4e5.up.railway.app";
        const isWss = wsUrlStr.startsWith("wss://");
        const hostWithoutScheme = wsUrlStr
          .replace("wss://", "")
          .replace("ws://", "");
        const hostParts = hostWithoutScheme.split(":");
        const host = hostParts[0];
        const portStr = hostParts[1];
        const port = portStr ? parseInt(portStr, 10) : isWss ? 443 : 80;

        const echo = new Echo({
          broadcaster: "reverb",
          key: process.env.EXPO_PUBLIC_REVERB_APP_KEY || "smartqueue_key",
          appid: process.env.EXPO_PUBLIC_REVERB_APP_ID || "smartqueue_id",
          wsHost: host,
          wsPort: port,
          wssPort: port,
          forceTLS: isWss,
          enabledTransports: ["ws", "wss"],
          disableStats: true,
          authorizer: (channel: any) => ({
            authorize: (socketId: string, callback: Function) => {
              axiosClient
                .post("/broadcasting/auth", {
                  socket_id: socketId,
                  channel_name: channel.name,
                })
                .then((response) => callback(false, response.data))
                .catch((error) => callback(true, error));
            },
          }),
        });

        echoRef.current = echo;

        echo
          .join(`service.${serviceId}`)
          .listen(".user.en_route", () => {
            if (isActive) fetchData();
          })
          .listen(".service.ticket.called", () => {
            if (isActive) fetchData();
          })
          .listen(".service.ticket.absent", () => {
            if (isActive) fetchData();
          })
          .listen(".service.ticket.served", () => {
            if (isActive) fetchData();
          });
      };

      connectRealtime();

      return () => {
        isActive = false;
        if (echoRef.current) {
          try {
            echoRef.current.leave(`service.${serviceId}`);
            echoRef.current.disconnect();
          } catch {}
          echoRef.current = null;
        }
      };
    }, [serviceId, fetchData]),
  );

  const markAbsent = async (ticket: Ticket) => {
    const maxAttempts = ticket.max_call_attempts ?? 2;
    const nextLevel = (ticket.absent_level ?? 0) + 1;
    const isDefinitive = nextLevel >= maxAttempts;
    try {
      await axiosClient.post(`/tickets/${ticket.id}/mark-absent`);
      fetchData();
    } catch (error) {
      console.error("Error marking absent:", error);
    }
  };

  const closeTicket = async (ticketId: number) => {
    try {
      await axiosClient.post(`/tickets/${ticketId}/close`);
      fetchData();
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getElapsedLabel = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const cfg = getStatusCfg(item.status);
    const calledAt = item.called_at || item.created_at;
    const isPresent = item.status === "present";
    const isEnRoute = item.status === "en_route";
    const absentLevel = item.absent_level ?? 0;
    const maxAttempts = (item as any).max_call_attempts ?? 2;
    const absentDefinitive = absentLevel >= maxAttempts;

    return (
      <View
        style={[
          styles.ticketCard,
          { backgroundColor: colors.surface, borderColor: cfg.color + "40" },
        ]}
      >
        {/* Header row */}
        <View style={styles.cardRow}>
          <View style={[styles.numberBadge, { backgroundColor: cfg.color }]}>
            <Text style={styles.numberText}>{item.number}</Text>
          </View>

          <View style={styles.cardMeta}>
            <View
              style={[styles.statusChip, { backgroundColor: cfg.color + "18" }]}
            >
              <Ionicons name={cfg.icon} size={11} color={cfg.color} />
              <Text style={[styles.statusChipText, { color: cfg.color }]}>
                {cfg.label}
              </Text>
            </View>
            <Text style={[styles.calledTime, { color: colors.textSecondary }]}>
              Appelé à {formatTime(calledAt)}
            </Text>
          </View>

          {/* Absent level badge */}
          {absentLevel > 0 && (
            <View style={[styles.elapsedBadge, { borderColor: absentDefinitive ? "#EF4444" : "#FF9500" }]}>
              <Text style={[styles.elapsedText, { color: absentDefinitive ? "#EF4444" : "#FF9500" }]}>
                {absentDefinitive ? "Absence définitive" : "Rappel disponible"}
              </Text>
            </View>
          )}

          {/* Elapsed badge */}
          <View
            style={[styles.elapsedBadge, { borderColor: cfg.color + "50" }]}
          >
            <Text style={[styles.elapsedText, { color: cfg.color }]}>
              {getElapsedLabel(calledAt)}
            </Text>
          </View>
        </View>

        {/* En route detail row */}
        {isEnRoute && item.estimated_travel_minutes != null && (
          <View style={[styles.infoRow, { backgroundColor: "#FF950014" }]}>
            <Ionicons name="time-outline" size={14} color="#FF9500" />
            <Text style={[styles.infoRowText, { color: "#FF9500" }]}>
              Arrivée estimée dans {item.estimated_travel_minutes} min
            </Text>
          </View>
        )}

        {/* Present detail row */}
        {isPresent && (
          <View style={[styles.infoRow, { backgroundColor: "#3B82F614" }]}>
            <Ionicons name="location" size={14} color="#3B82F6" />
            <Text style={[styles.infoRowText, { color: "#3B82F6" }]}>
              Usager présent sur place
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {/* "Absent" only for called / en_route — not when already present or already definitive */}
          {!isPresent && !absentDefinitive && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
              onPress={() => markAbsent(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-remove" size={16} color="white" />
              <Text style={styles.actionBtnText}>{absentLevel >= 1 ? `Absent ${absentLevel+1}/${maxAttempts}` : "Absent"}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isPresent ? "#3B82F6" : "#22C55E" },
            ]}
            onPress={() => closeTicket(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.actionBtnText}>
              {isPresent ? "Clôturer" : "Terminer"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="megaphone" size={22} color="#FF9500" />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Tickets appelés
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: "#FF9500" }]}>
          <Text style={styles.countText}>{tickets.length}</Text>
        </View>
      </View>

      {/* Status legend */}
      <View style={[styles.legend, { borderBottomColor: colors.border }]}>
        {(["called", "en_route", "present"] as const).map((s) => {
          const c = STATUS_CONFIG[s];
          const count = tickets.filter((t) => t.status === s).length;
          return (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.color }]} />
              <Text
                style={[styles.legendLabel, { color: colors.textSecondary }]}
              >
                {c.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.legendCount,
                    { backgroundColor: c.color + "20" },
                  ]}
                >
                  <Text style={[styles.legendCountText, { color: c.color }]}>
                    {count}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor="#FF9500"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: colors.border + "80" },
                ]}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={40}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Aucun ticket appelé
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Les tickets appelés apparaîtront ici
              </Text>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            tickets.length === 0 && { flexGrow: 1, justifyContent: "center" },
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countText: { color: "white", fontWeight: "700", fontSize: 14 },
  legend: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12 },
  legendCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  legendCountText: { fontSize: 11, fontWeight: "700" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 100 },
  ticketCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  numberBadge: {
    width: 52,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { color: "white", fontWeight: "800", fontSize: 15 },
  cardMeta: { flex: 1, gap: 4 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  calledTime: { fontSize: 12 },
  elapsedBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elapsedText: { fontSize: 12, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  infoRowText: { fontSize: 13, fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: { color: "white", fontWeight: "600", fontSize: 13 },
  emptyState: { alignItems: "center", gap: 12 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
