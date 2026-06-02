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
};

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
      // Prefer service queue endpoint which returns all statuses for the service
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
    } catch (error) {
      // Fallback to agent/tickets if service endpoint fails
      try {
        const response = await axiosClient.get("/agent/tickets", {
          params: {
            service_id: parseInt(serviceId),
            status: "called",
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
            if (!isActive) return;
            fetchData();
          })
          .listen(".service.ticket.called", () => {
            if (!isActive) return;
            fetchData();
          })
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

  const markAbsent = async (ticketId: number) => {
    try {
      await axiosClient.post(`/tickets/${ticketId}/mark-absent`);
      fetchData();
    } catch (error: any) {
      console.error("Error marking absent:", error);
    }
  };

  const closeTicket = async (ticketId: number) => {
    try {
      await axiosClient.post(`/tickets/${ticketId}/close`);
      fetchData();
    } catch (error: any) {
      console.error("Error closing ticket:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <View
      style={[
        styles.ticketCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.ticketHeader}>
        <View style={[styles.ticketNumber, { backgroundColor: "#FF9500" }]}>
          <Text style={styles.ticketNumberText}>{item.number}</Text>
        </View>
        <Text style={[styles.ticketTime, { color: colors.textSecondary }]}>
          Appelé à {formatTime(item.called_at || item.created_at)}
        </Text>
      </View>

      {item.en_route_at && (
        <View style={styles.presenceRow}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={[styles.presenceText, { color: "#166534" }]}>
            {item.status === "present"
              ? "Usager présent sur place"
              : item.estimated_travel_minutes != null
                ? `Usager en route · ≈ ${item.estimated_travel_minutes} min`
                : "Présence confirmée"}
          </Text>
        </View>
      )}

      <View style={styles.ticketActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FF3B30" }]}
          onPress={() => markAbsent(item.id)}
        >
          <Ionicons name="person-remove" size={18} color="white" />
          <Text style={styles.actionBtnText}>Absent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
          onPress={() => closeTicket(item.id)}
        >
          <Ionicons name="checkmark-circle" size={18} color="white" />
          <Text style={styles.actionBtnText}>Terminer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="megaphone" size={24} color="#FF9500" />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Tickets appelés
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: "#FF9500" }]}>
          <Text style={styles.countText}>{tickets.length}</Text>
        </View>
      </View>

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
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="megaphone-outline"
              size={64}
              color={colors.textSecondary}
            />
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
        contentContainerStyle={styles.listContent}
      />
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
  listContent: { padding: 12, paddingBottom: 100 },
  ticketCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ticketNumber: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  ticketNumberText: { color: "white", fontWeight: "700", fontSize: 16 },
  ticketTime: { fontSize: 12 },
  presenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  presenceText: { fontSize: 13, fontWeight: "700" },
  ticketActions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnText: { color: "white", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginTop: 6, textAlign: "center" },
});
