import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useCustomAlert } from "../../src/hooks/useCustomAlert";
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
  position?: number | null;
  priority: string;
  created_at: string;
  called_at?: string;
  en_route_at?: string | null;
  present_at?: string | null;
  response_received_at?: string | null;
  en_route_expires_at?: string | null;
  estimated_travel_minutes?: number | null;
};

type ServiceStats = {
  waiting: number;
  processed: number;
  avg_wait_time: number;
};

export default function AgentQueue() {
  const colors = useThemeColors();
  const { AlertComponent, showSuccess, showWarning, showError } =
    useCustomAlert();
  const params = useLocalSearchParams<{
    serviceId: string;
    counterId: string;
  }>();
  const serviceId = params.serviceId;
  const counterId = params.counterId;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<string>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const echoRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    if (!serviceId) return;
    try {
      const [queueRes, statsRes, serviceRes] = await Promise.all([
        axiosClient.get(`/services/${serviceId}/queue`),
        axiosClient.get(`/services/${serviceId}/affluence`),
        axiosClient.get(`/services/${serviceId}`),
      ]);

      const waitingTickets = (queueRes.data?.tickets || []).filter(
        (t: Ticket) => t.status === "waiting",
      );

      // Normalize positions to numbers and sort safely
      waitingTickets.sort((a: Ticket, b: Ticket) => {
        const pa =
          typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER;
        const pb =
          typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER;
        return pa - pb;
      });

      setTickets(waitingTickets);
      setFilteredTickets(waitingTickets);
      setStats({
        waiting: statsRes.data?.waiting || statsRes.data?.people || 0,
        processed: statsRes.data?.processed || 0,
        avg_wait_time:
          statsRes.data?.eta_avg || statsRes.data?.average_wait_time || 0,
      });
      setServiceStatus(serviceRes.data?.status || "open");

      // Find currently called ticket
      const calledTicket = (queueRes.data?.tickets || []).find(
        (t: Ticket) =>
          t.status === "present" ||
          t.status === "called" ||
          t.status === "en_route",
      );
      setCurrentTicket(calledTicket || null);
    } catch (error) {
      console.error("Error fetching queue:", error);
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

        // Build echo like before (keeps existing config)
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
          .listen(".user.en_route", (e: any) => {
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
          })
          .listen(".service.stats.updated", () => {
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTickets(tickets);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredTickets(
        tickets.filter(
          (t) =>
            t.number.toLowerCase().includes(q) ||
            String(t.position ?? "").includes(q),
        ),
      );
    }
  }, [searchQuery, tickets]);

  const callNext = async () => {
    if (!serviceId) return;
    setIsActing(true);
    try {
      const payload: any = {};
      if (counterId) payload.counter_id = parseInt(counterId);

      await axiosClient.post(
        `/services/${parseInt(serviceId)}/call-next`,
        payload,
      );
      await fetchData();
      showSuccess("Appel réussi", "Le prochain ticket a été appelé");
    } catch (error: any) {
      showError(
        "Erreur",
        error?.response?.data?.message || "Erreur lors de l'appel",
      );
    } finally {
      setIsActing(false);
    }
  };

  const markAbsent = async (ticketId: number, ticketNumber?: string) => {
    showWarning(
      "Marquer absent",
      `Voulez-vous marquer le ticket ${ticketNumber ?? ticketId} comme absent ?`,
      "Marquer absent",
      async () => {
        setIsActing(true);
        try {
          await axiosClient.post(`/tickets/${ticketId}/mark-absent`);
          await fetchData();
          showSuccess("Succès", "Ticket marqué comme absent");
        } catch (error: any) {
          showError("Erreur", error?.response?.data?.message || "Erreur");
        } finally {
          setIsActing(false);
        }
      },
      "Annuler",
    );
  };

  const recall = async (ticketId: number) => {
    setIsActing(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/recall`);
      showSuccess("Rappel envoyé", "Le client a été notifié");
    } catch (error: any) {
      showError("Erreur", error?.response?.data?.message || "Erreur");
    } finally {
      setIsActing(false);
    }
  };

  const closeTicket = async (ticketId: number) => {
    showWarning(
      "Terminer le service",
      `Voulez-vous terminer le service pour le ticket ${ticketId} ?`,
      "Terminer",
      async () => {
        setIsActing(true);
        try {
          await axiosClient.post(`/tickets/${ticketId}/close`);
          await fetchData();
          showSuccess("Service terminé", "Le ticket a été clôturé");
        } catch (error: any) {
          showError("Erreur", error?.response?.data?.message || "Erreur");
        } finally {
          setIsActing(false);
        }
      },
      "Annuler",
    );
  };

  const renderTicket = ({ item, index }: { item: Ticket; index: number }) => {
    const priorityColor =
      item.priority === "vip"
        ? "#FFD60A"
        : item.priority === "high"
          ? "#FF9500"
          : "#22C55E";
    const formattedWait = (() => {
      try {
        const created = new Date(item.created_at);
        const mins = Math.max(
          0,
          Math.floor((Date.now() - created.getTime()) / 60000),
        );
        if (mins < 1) return "À l'instant";
        if (mins < 60) return `${mins} min`;
        const h = Math.floor(mins / 60);
        return `${h}h`;
      } catch {
        return "--";
      }
    })();

    return (
      <View
        style={[
          styles.ticketRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.rankPill, { backgroundColor: priorityColor + "20" }]}
        >
          <Text style={[styles.rankText, { color: priorityColor }]}>
            {item.position ?? index + 1}
          </Text>
        </View>

        <View style={styles.ticketMain}>
          <Text
            style={[styles.ticketNumber, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.number}
          </Text>
          <Text
            style={[styles.ticketMeta, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.priority.toUpperCase()} · Pris à{" "}
            {new Date(item.created_at).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={styles.ticketRight}>
          <Text style={[styles.waitText, { color: colors.textSecondary }]}>
            {formattedWait}
          </Text>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: "#FF3B30" }]}
            onPress={() => markAbsent(item.id, item.number)}
          >
            <Ionicons name="person-remove" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop:
              Platform.OS === "ios" ? 12 : StatusBar.currentHeight || 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          File d attente
        </Text>

        <TouchableOpacity
          style={[
            styles.statusToggle,
            {
              backgroundColor: serviceStatus === "open" ? "#22C55E" : "#EF4444",
            },
          ]}
          onPress={() => {
            // Toggle service open/closed
            const newStatus = serviceStatus === "open" ? "closed" : "open";
            (async () => {
              setIsActing(true);
              try {
                if (serviceStatus === "open") {
                  await axiosClient.post(
                    `/services/${parseInt(serviceId || "0")}/close`,
                  );
                } else {
                  await axiosClient.post(
                    `/services/${parseInt(serviceId || "0")}/open`,
                  );
                }
                setServiceStatus(newStatus);
                showSuccess(
                  "Succès",
                  `Service ${newStatus === "open" ? "ouvert" : "fermé"}`,
                );
              } catch (err: any) {
                showError(
                  "Erreur",
                  err?.response?.data?.message || err?.message || "Erreur",
                );
              } finally {
                setIsActing(false);
              }
            })();
          }}
          disabled={isActing}
        >
          <Ionicons
            name={
              serviceStatus === "open" ? "checkmark-circle" : "close-circle"
            }
            size={16}
            color="white"
          />
          <Text style={styles.statusToggleText}>
            {serviceStatus === "open" ? "Ouvert" : "Fermé"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Rechercher un numéro..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        style={{ flex: 1 }}
        data={filteredTickets}
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
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons
              name="ticket-outline"
              size={56}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              File vide
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun ticket en attente
            </Text>
          </View>
        )}
      />

      {AlertComponent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", marginLeft: 8 },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  statusToggleText: { color: "white", fontSize: 13, fontWeight: "600" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    margin: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", padding: 0 },
  queueSection: { flex: 1 },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  rankPill: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rankText: { fontWeight: "800", fontSize: 16 },
  ticketMain: { flex: 1, justifyContent: "center" },
  ticketNumber: { fontSize: 16, fontWeight: "700" },
  ticketMeta: { fontSize: 12, marginTop: 2 },
  ticketRight: { alignItems: "flex-end", justifyContent: "center", gap: 8 },
  waitText: { fontSize: 12, fontWeight: "600" },
  smallBtn: { marginTop: 6, padding: 8, borderRadius: 8 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyText: { fontSize: 13, marginTop: 4 },
});
