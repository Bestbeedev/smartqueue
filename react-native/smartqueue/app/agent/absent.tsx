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
  absent_at: string | null;
  created_at: string;
  service_name?: string;
  absent_level?: number;
  absent_expires_at?: string | null;
  max_call_attempts?: number;
};

const ABSENT_RED = "#EF4444";

export default function AbsentTickets() {
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
        ? all.filter((t: any) => t.status === "absent")
        : [];
      setTickets(filtered);
    } catch {
      try {
        const response = await axiosClient.get("/agent/tickets", {
          params: {
            service_id: parseInt(serviceId),
            status: "absent",
            per_page: 50,
          },
        });
        setTickets(response.data?.data || []);
      } catch (e) {
        console.error("Error fetching absent tickets:", e);
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

  // WebSocket real-time : écoute les événements absent et served
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
          .listen(".service.ticket.absent", () => {
            if (!isActive) return;
            fetchData();
          })
          .listen(".service.ticket.served", () => {
            if (!isActive) return;
            fetchData();
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

  const recallTicket = async (ticketId: number) => {
    try {
      await axiosClient.post(`/tickets/${ticketId}/recall`);
      fetchData();
    } catch (error: any) {
      console.error("Error recalling ticket:", error);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

  const getElapsedLabel = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const refDate = item.absent_at || item.created_at;
    const absentLevel = item.absent_level ?? 0;
    const maxAttempts = (item as any).max_call_attempts ?? 2;
    const isDefinitive = absentLevel >= maxAttempts;
    const cardColor = isDefinitive ? "#DC2626" : ABSENT_RED;

    return (
      <View
        style={[
          styles.ticketCard,
          { backgroundColor: colors.surface, borderColor: isDefinitive ? "#DC262660" : ABSENT_RED + "40" },
        ]}
      >
        {/* Header row */}
        <View style={styles.cardRow}>
          <View style={[styles.numberBadge, { backgroundColor: cardColor }]}>
            <Text style={styles.numberText}>{item.number}</Text>
          </View>

          <View style={styles.cardMeta}>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: isDefinitive ? "#DC262618" : ABSENT_RED + "18" },
              ]}
            >
              <Ionicons name="person-remove" size={11} color={cardColor} />
              <Text style={[styles.statusChipText, { color: cardColor }]}>
                {isDefinitive ? "ABSENT DÉF." : "ABSENT"}
              </Text>
            </View>
            <Text style={[styles.metaTime, { color: colors.textSecondary }]}>
              {formatDate(refDate)} · {formatTime(refDate)}
            </Text>
          </View>

          {/* Absent level badge */}
          <View
            style={[styles.elapsedBadge, { borderColor: isDefinitive ? "#DC262660" : ABSENT_RED + "50" }]}
          >
            <Text style={[styles.elapsedText, { color: cardColor }]}>
              {isDefinitive ? "Absence définitive" : "Rappel disponible"}
            </Text>
          </View>

          <View
            style={[styles.elapsedBadge, { borderColor: ABSENT_RED + "50" }]}
          >
            <Text style={[styles.elapsedText, { color: ABSENT_RED }]}>
              {getElapsedLabel(refDate)}
            </Text>
          </View>
        </View>

        {/* Recall action — disabled pour absence définitive */}
        <TouchableOpacity
          style={[styles.recallBtn, { backgroundColor: isDefinitive ? "#6B7280" : ABSENT_RED }]}
          onPress={() => !isDefinitive && recallTicket(item.id)}
          activeOpacity={0.78}
          disabled={isDefinitive}
        >
          <Ionicons name="megaphone" size={15} color="white" />
          <Text style={styles.recallBtnText}>
            {isDefinitive ? "Rappel impossible" : "Rappeler"}
          </Text>
        </TouchableOpacity>
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
          <Ionicons name="person-remove" size={22} color={ABSENT_RED} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Tickets absents
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: ABSENT_RED }]}>
          <Text style={styles.countText}>{tickets.length}</Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: ABSENT_RED + "12" }]}>
        <Ionicons
          name="information-circle-outline"
          size={15}
          color={ABSENT_RED}
        />
        <Text style={[styles.infoText, { color: ABSENT_RED }]}>
          {"Rappel disponible : l'usager peut encore être rappelé · Absence définitive : ticket clôturé, rappel impossible"}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ABSENT_RED} />
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
              tintColor={ABSENT_RED}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View
                style={[styles.emptyIconWrap, { backgroundColor: "#22C55E18" }]}
              >
                <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Aucun absent
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Tous les usagers ont répondu présents
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  infoText: { fontSize: 12, flex: 1, fontWeight: "500" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 120 },
  ticketCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    gap: 12,
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
  statusChipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  metaTime: { fontSize: 12 },
  elapsedBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elapsedText: { fontSize: 12, fontWeight: "700" },
  recallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  recallBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
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
