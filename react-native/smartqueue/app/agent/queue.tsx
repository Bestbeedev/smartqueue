import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Platform,
  StatusBar,
  useWindowDimensions,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
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
  priority_reason?: string | null;
  source?: string | null;
  customer_name?: string | null;
  is_senior?: boolean;
  is_handicap?: boolean;
  is_pregnant?: boolean;
  created_at: string;
  called_at?: string;
  en_route_at?: string | null;
  present_at?: string | null;
  response_received_at?: string | null;
  en_route_expires_at?: string | null;
  estimated_travel_minutes?: number | null;
  eta_minutes?: number | null;
  auto_deferred?: boolean;
  defer_reason?: string | null;
  valid_date?: string | null;
};

type ServiceStats = {
  waiting: number;
  processed: number;
  avg_wait_time: number;
};

type SmartQueueData = {
  critical_zone: boolean;
  intelligent_cutoff_at: string | null;
  waiting_count_today: number;
  estimated_load_minutes: number;
  is_open_now: boolean;
  closing_time: string | null;
  reason_if_closed: string | null;
};

type ThemeColors = ReturnType<typeof useThemeColors>;

type CreateTicketForm = {
  priority: "normal" | "high" | "vip" | "urgence";
  priority_reason: string;
  customer_name: string;
  customer_phone: string;
  is_senior: boolean;
  is_handicap: boolean;
  is_pregnant: boolean;
};

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `il y a ${h}h${m}` : `il y a ${h}h`;
  } catch {
    return "--";
  }
}

function fmtTime(dateStr?: string | null): string {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

function fmtCutoff(iso?: string | null): string {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

const PRIORITY_CFG: Record<string, { color: string; label: string }> = {
  urgence: { color: "#FF3B30", label: "URG" },
  vip:     { color: "#8B5CF6", label: "VIP" },
  high:    { color: "#FF9500", label: "PRIO" },
  normal:  { color: "#8E8E93", label: "STD" },
};

const SOURCE_ICON: Record<string, string> = {
  app:     "phone-portrait-outline",
  qr_scan: "qr-code-outline",
  agent:   "person-circle-outline",
  kiosk:   "desktop-outline",
  sms:     "chatbubble-outline",
};

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  waiting: { color: "#007AFF", label: "Attente" },
  called: { color: "#34C759", label: "Appelé" },
  absent: { color: "#FF3B30", label: "Absent" },
  en_route: { color: "#FF9500", label: "En route" },
  present: { color: "#34C759", label: "Présent" },
};

const KpiPill = ({ icon, label, value, accent, colors }: any) => (
  <View style={[styles.kpiPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.kpiIcon, { backgroundColor: accent + "1A" }]}>
      <Ionicons name={icon} size={14} color={accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.kpiValue, { color: accent }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
    </View>
  </View>
);

const SmartQueueBanner = ({ data, colors }: { data: SmartQueueData; colors: ThemeColors }) => {
  if (data.critical_zone) {
    return (
      <View style={[styles.bannerWarning, { backgroundColor: "#FF3B300F", borderColor: "#FF3B3030" }]}>
        <View style={styles.bannerIconWarning}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitleWarning}>Zone critique — file saturée</Text>
          <Text style={styles.bannerSubWarning}>Les nouveaux tickets sont automatiquement reportés</Text>
        </View>
      </View>
    );
  }

  const loadH = Math.floor(data.estimated_load_minutes / 60);
  const loadM = data.estimated_load_minutes % 60;
  const loadLabel = data.estimated_load_minutes <= 0 ? "—" : loadH > 0 ? `${loadH}h${loadM > 0 ? loadM + "min" : ""}` : `${loadM}min`;
  const cutoffLabel = fmtCutoff(data.intelligent_cutoff_at);

  return (
    <View style={[styles.bannerNormal, { backgroundColor: "#34C7590F", borderColor: "#34C75930" }]}>
      <View style={styles.bannerIconNormal}>
        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitleNormal}>Capacité normale</Text>
        <Text style={[styles.bannerSubNormal, { color: colors.textSecondary }]}>
          Charge estimée : {loadLabel} · Coupure à {cutoffLabel}
        </Text>
      </View>
      {data.intelligent_cutoff_at && (
        <View style={styles.bannerChip}>
          <Text style={styles.bannerChipText}>{cutoffLabel}</Text>
        </View>
      )}
    </View>
  );
};

const CurrentTicketCard = ({ ticket, onRecall, onAbsent, onClose, isActing, colors }: any) => {
  const statusCfg = STATUS_CFG[ticket.status] ?? { color: "#007AFF", label: ticket.status };
  let statusLine = "";
  if (ticket.status === "present") statusLine = "Usager présent";
  else if (ticket.en_route_at) statusLine = ticket.estimated_travel_minutes ? `En route · ≈ ${ticket.estimated_travel_minutes} min` : "Réponse reçue";
  else if (ticket.called_at) statusLine = `Appelé à ${fmtTime(ticket.called_at)}`;

  return (
    <View style={[styles.currentCard, { backgroundColor: "#1558CC" }]}>
      <View style={styles.currentRow}>
        <View style={styles.currentIcon}>
          <Ionicons name="megaphone" size={18} color="#FFF" />
        </View>
        <View style={styles.currentNumberContainer}>
          <Text style={styles.currentNumber}>{ticket.number}</Text>
          <View style={styles.currentStatusBadge}>
            <Text style={styles.currentStatusText}>{statusCfg.label.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      {statusLine !== "" && <Text style={styles.currentStatusLine}>{statusLine}</Text>}
      <View style={styles.currentActions}>
        <TouchableOpacity style={styles.currentActionBtn} onPress={onRecall} disabled={isActing}>
          <Ionicons name="volume-high" size={14} color="#FFF" />
          <Text style={styles.currentActionText}>Rappel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.currentActionBtn, { backgroundColor: "rgba(228, 37, 26, 0.95)" }]} onPress={onAbsent} disabled={isActing}>
          <Ionicons name="person-remove" size={14} color="#FFF" />
          <Text style={styles.currentActionText}>Absent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.currentActionBtn, { backgroundColor: "rgba(32, 230, 82, 0.89)" }]} onPress={onClose} disabled={isActing}>
          <Ionicons name="checkmark-circle" size={14} color="#FFF" />
          <Text style={styles.currentActionText}>Servi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TicketRow = ({ item, index, colors, onAbsent }: any) => {
  const prio = PRIORITY_CFG[item.priority] ?? PRIORITY_CFG.normal;
  const statusCfg = STATUS_CFG[item.status] ?? { color: "#8E8E93", label: item.status };
  const etaLabel = typeof item.eta_minutes === "number" && item.eta_minutes > 0 ? `≈ ${item.eta_minutes}min` : null;
  const sourceIcon = item.source ? (SOURCE_ICON[item.source] ?? "help-circle-outline") : null;
  const hasAttrs = item.is_senior || item.is_handicap || item.is_pregnant;

  return (
    <View style={[styles.ticketRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.ticketPosition, { backgroundColor: prio.color + "18", borderColor: prio.color + "40" }]}>
        <Text style={[styles.ticketPositionText, { color: prio.color }]}>{item.position ?? index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.ticketHeaderRow}>
          <Text style={[styles.ticketNumber, { color: colors.textPrimary }]} numberOfLines={1}>{item.number}</Text>
          <View style={[styles.ticketPriorityBadge, { backgroundColor: prio.color + "20" }]}>
            <Text style={[styles.ticketPriorityText, { color: prio.color }]}>{prio.label}</Text>
          </View>
          {etaLabel && (
            <View style={styles.ticketEtaBadge}>
              <Text style={styles.ticketEtaText}>{etaLabel}</Text>
            </View>
          )}
          {sourceIcon && (
            <Ionicons name={sourceIcon as any} size={11} color={colors.textSecondary} />
          )}
          {hasAttrs && (
            <View style={{ flexDirection: "row", gap: 2 }}>
              {item.is_senior && <Ionicons name="accessibility-outline" size={11} color="#007AFF" />}
              {item.is_handicap && <Ionicons name="heart-outline" size={11} color="#8B5CF6" />}
              {item.is_pregnant && <Ionicons name="body-outline" size={11} color="#FF6B9D" />}
            </View>
          )}
        </View>
        {item.customer_name ? (
          <Text style={[styles.ticketMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.customer_name} · {fmtTime(item.created_at)}
          </Text>
        ) : (
          <Text style={[styles.ticketMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            Pris à {fmtTime(item.created_at)} · {timeAgo(item.created_at)}
          </Text>
        )}
      </View>
      <View style={[styles.ticketStatusBadge, { backgroundColor: statusCfg.color + "18", borderColor: statusCfg.color + "35" }]}>
        <Text style={[styles.ticketStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
      </View>
      <TouchableOpacity style={styles.ticketAbsentBtn} onPress={() => onAbsent(item.id, item.number)}>
        <Ionicons name="person-remove-outline" size={14} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
};

// ─── Checkbox row ─────────────────────────────────────────────────────────────
const CheckRow = ({ label, icon, checked, onToggle, colors }: { label: string; icon: string; checked: boolean; onToggle: () => void; colors: ThemeColors }) => (
  <TouchableOpacity style={[cmStyles.checkRow, { borderColor: checked ? "#007AFF40" : colors.border, backgroundColor: checked ? "#007AFF08" : colors.surface }]} onPress={onToggle} activeOpacity={0.7}>
    <View style={[cmStyles.checkIcon, { backgroundColor: checked ? "#007AFF18" : colors.border + "40" }]}>
      <Ionicons name={icon as any} size={16} color={checked ? "#007AFF" : colors.textSecondary} />
    </View>
    <Text style={[cmStyles.checkLabel, { color: colors.textPrimary }]}>{label}</Text>
    <View style={[cmStyles.checkbox, { borderColor: checked ? "#007AFF" : colors.border, backgroundColor: checked ? "#007AFF" : "transparent" }]}>
      {checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
    </View>
  </TouchableOpacity>
);

// ─── Priority selector ────────────────────────────────────────────────────────
const PRIO_OPTIONS: { value: CreateTicketForm["priority"]; label: string; color: string; icon: string }[] = [
  { value: "normal",  label: "Normal",      color: "#8E8E93", icon: "list-outline" },
  { value: "high",    label: "Prioritaire", color: "#FF9500", icon: "flame-outline" },
  { value: "vip",     label: "VIP",         color: "#8B5CF6", icon: "star-outline" },
  { value: "urgence", label: "Urgence",     color: "#FF3B30", icon: "alert-circle-outline" },
];

const REASON_OPTIONS = [
  { value: "senior",    label: "Senior" },
  { value: "handicap",  label: "Handicap" },
  { value: "pregnant",  label: "Femme enceinte" },
  { value: "other",     label: "Autre" },
];

const PrioritySelector = ({ value, onChange, colors }: { value: string; onChange: (v: CreateTicketForm["priority"]) => void; colors: ThemeColors }) => (
  <View style={cmStyles.prioRow}>
    {PRIO_OPTIONS.map((opt) => {
      const active = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[cmStyles.prioBtn, { borderColor: active ? opt.color : colors.border, backgroundColor: active ? opt.color + "18" : colors.surface }]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <Ionicons name={opt.icon as any} size={16} color={active ? opt.color : colors.textSecondary} />
          <Text style={[cmStyles.prioBtnText, { color: active ? opt.color : colors.textSecondary, fontWeight: active ? "700" : "500" }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Modal de création ────────────────────────────────────────────────────────
const CreateTicketModal = ({
  visible, onClose, form, setForm, onSubmit, isCreating, colors,
}: {
  visible: boolean;
  onClose: () => void;
  form: CreateTicketForm;
  setForm: React.Dispatch<React.SetStateAction<CreateTicketForm>>;
  onSubmit: () => void;
  isCreating: boolean;
  colors: ThemeColors;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableOpacity style={cmStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[cmStyles.sheet, { backgroundColor: colors.background }]}>
        {/* Drag handle */}
        <View style={[cmStyles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[cmStyles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[cmStyles.sheetTitle, { color: colors.textPrimary }]}>Créer un ticket</Text>
            <Text style={[cmStyles.sheetSub, { color: colors.textSecondary }]}>Création manuelle par l'agent</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={cmStyles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={cmStyles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Type de ticket */}
          <Text style={[cmStyles.sectionLabel, { color: colors.textSecondary }]}>Type de ticket</Text>
          <PrioritySelector value={form.priority} onChange={(v) => setForm(f => ({ ...f, priority: v }))} colors={colors} />

          {/* Motif de priorité (si non normal) */}
          {form.priority !== "normal" && (
            <>
              <Text style={[cmStyles.sectionLabel, { color: colors.textSecondary }]}>Motif de priorité</Text>
              <View style={cmStyles.prioRow}>
                {REASON_OPTIONS.map((opt) => {
                  const active = form.priority_reason === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[cmStyles.prioBtn, { borderColor: active ? "#007AFF" : colors.border, backgroundColor: active ? "#007AFF18" : colors.surface }]}
                      onPress={() => setForm(f => ({ ...f, priority_reason: active ? "" : opt.value }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[cmStyles.prioBtnText, { color: active ? "#007AFF" : colors.textSecondary, fontWeight: active ? "700" : "500" }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Nom du client */}
          <Text style={[cmStyles.sectionLabel, { color: colors.textSecondary }]}>Nom du client</Text>
          <View style={[cmStyles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={[cmStyles.input, { color: colors.textPrimary }]}
              placeholder="Nom complet"
              placeholderTextColor={colors.textSecondary}
              value={form.customer_name}
              onChangeText={(v) => setForm(f => ({ ...f, customer_name: v }))}
            />
          </View>

          {/* Téléphone */}
          <Text style={[cmStyles.sectionLabel, { color: colors.textSecondary }]}>Téléphone</Text>
          <View style={[cmStyles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={[cmStyles.input, { color: colors.textPrimary }]}
              placeholder="+33 6 00 00 00 00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={form.customer_phone}
              onChangeText={(v) => setForm(f => ({ ...f, customer_phone: v }))}
            />
          </View>

          {/* Attributs spéciaux */}
          <Text style={[cmStyles.sectionLabel, { color: colors.textSecondary }]}>Attributs spéciaux</Text>
          <CheckRow label="Senior" icon="accessibility-outline" checked={form.is_senior} onToggle={() => setForm(f => ({ ...f, is_senior: !f.is_senior }))} colors={colors} />
          <CheckRow label="Handicap" icon="body-outline" checked={form.is_handicap} onToggle={() => setForm(f => ({ ...f, is_handicap: !f.is_handicap }))} colors={colors} />
          <CheckRow label="Femme enceinte" icon="heart-outline" checked={form.is_pregnant} onToggle={() => setForm(f => ({ ...f, is_pregnant: !f.is_pregnant }))} colors={colors} />
        </ScrollView>

        {/* Actions */}
        <View style={[cmStyles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity style={[cmStyles.cancelBtn, { borderColor: colors.border }]} onPress={onClose} disabled={isCreating}>
            <Text style={[cmStyles.cancelText, { color: colors.textSecondary }]}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cmStyles.submitBtn, { backgroundColor: isCreating ? "#007AFF80" : "#007AFF" }]}
            onPress={onSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <Text style={cmStyles.submitText}>Création...</Text>
            ) : (
              <>
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={cmStyles.submitText}>Créer le ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const cmStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20, maxHeight: "90%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  sheetSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginTop: 16 },
  prioRow: { flexDirection: "row", gap: 8 },
  prioBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10 },
  prioBtnText: { fontSize: 12 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, gap: 8 },
  input: { flex: 1, fontSize: 14, padding: 0 },
  checkRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8, gap: 10 },
  checkIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600" },
  submitBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingVertical: 13 },
  submitText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});

export default function AgentQueue() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const { AlertComponent, showSuccess, showWarning, showError } = useCustomAlert();
  const params = useLocalSearchParams<{ serviceId: string; counterId: string }>();
  const serviceId = params.serviceId;
  const counterId = params.counterId;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [smartQueue, setSmartQueue] = useState<SmartQueueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<string>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTicketForm>({
    priority: "normal",
    priority_reason: "",
    customer_name: "",
    customer_phone: "",
    is_senior: false,
    is_handicap: false,
    is_pregnant: false,
  });
  const [isCreating, setIsCreating] = useState(false);
  const echoRef = useRef<any>(null);
  const hPad = width >= 768 ? 16 : 12;

  const fetchData = useCallback(async () => {
    if (!serviceId) return;
    try {
      const [queueRes, statsRes, serviceRes, availRes] = await Promise.all([
        axiosClient.get(`/services/${serviceId}/queue`),
        axiosClient.get(`/services/${serviceId}/affluence`),
        axiosClient.get(`/services/${serviceId}`),
        axiosClient.get(`/services/${serviceId}/availability`).catch(() => null),
      ]);

      const waitingTickets = (queueRes.data?.tickets || []).filter((t: Ticket) => t.status === "waiting");
      waitingTickets.sort((a: Ticket, b: Ticket) => (a.position ?? Infinity) - (b.position ?? Infinity));

      setTickets(waitingTickets);
      setFilteredTickets(waitingTickets);
      setStats({
        waiting: statsRes.data?.waiting || statsRes.data?.people || 0,
        processed: statsRes.data?.processed || 0,
        avg_wait_time: statsRes.data?.eta_avg || statsRes.data?.average_wait_time || 0,
      });
      setServiceStatus(serviceRes.data?.status || "open");

      if (availRes?.data) {
        const cap = availRes.data.capacity ?? {};
        const avail = availRes.data.availability ?? {};
        setSmartQueue({
          critical_zone: cap.critical_zone ?? false,
          intelligent_cutoff_at: cap.intelligent_cutoff_at ?? null,
          waiting_count_today: cap.waiting_count_today ?? 0,
          estimated_load_minutes: cap.estimated_load_minutes ?? 0,
          is_open_now: avail.is_open_now ?? true,
          closing_time: avail.closing_time ?? null,
          reason_if_closed: avail.reason_if_closed ?? null,
        });
      }

      const calledTicket = (queueRes.data?.tickets || []).find(
        (t: Ticket) => t.status === "present" || t.status === "called" || t.status === "en_route"
      );
      setCurrentTicket(calledTicket || null);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [serviceId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const connectRealtime = async () => {
        if (!serviceId || echoRef.current) return;
        const token = await AsyncStorage.getItem("access_token");
        if (!token) return;

        const wsUrlStr = process.env.EXPO_PUBLIC_WS_URL || "wss://reverb-production-b4e5.up.railway.app";
        const isWss = wsUrlStr.startsWith("wss://");
        const hostWithoutScheme = wsUrlStr.replace("wss://", "").replace("ws://", "");
        const host = hostWithoutScheme.split(":")[0];

        const echo = new Echo({
          broadcaster: "reverb",
          key: process.env.EXPO_PUBLIC_REVERB_APP_KEY || "smartqueue_key",
          appid: process.env.EXPO_PUBLIC_REVERB_APP_ID || "smartqueue_id",
          wsHost: host,
          wsPort: isWss ? 443 : 80,
          wssPort: 443,
          forceTLS: isWss,
          enabledTransports: ["ws", "wss"],
          authorizer: (channel: any) => ({
            authorize: (socketId: string, callback: Function) => {
              axiosClient.post("/broadcasting/auth", { socket_id: socketId, channel_name: channel.name })
                .then((response) => callback(false, response.data))
                .catch((error) => callback(true, error));
            },
          }),
        });

        echoRef.current = echo;
        echo.join(`service.${serviceId}`)
          .listen(".user.en_route", () => { if (isActive) fetchData(); })
          .listen(".service.ticket.called", () => { if (isActive) fetchData(); })
          .listen(".service.ticket.absent", () => { if (isActive) fetchData(); })
          .listen(".service.ticket.served", () => { if (isActive) fetchData(); })
          .listen(".service.stats.updated", () => { if (isActive) fetchData(); });
      };
      connectRealtime();
      return () => {
        isActive = false;
        if (echoRef.current) { try { echoRef.current.leave(`service.${serviceId}`); echoRef.current.disconnect(); } catch {} echoRef.current = null; }
      };
    }, [serviceId, fetchData])
  );

  useEffect(() => {
    if (!searchQuery.trim()) setFilteredTickets(tickets);
    else {
      const q = searchQuery.toLowerCase();
      setFilteredTickets(tickets.filter(t => t.number.toLowerCase().includes(q) || String(t.position ?? "").includes(q)));
    }
  }, [searchQuery, tickets]);

  const handleCallNext = async () => {
    if (!serviceId) return;
    setIsActing(true);
    try {
      const payload: any = {};
      if (counterId) payload.counter_id = parseInt(counterId);
      await axiosClient.post(`/services/${parseInt(serviceId)}/call-next`, payload);
      await fetchData();
      showSuccess("Appel réussi", "Prochain ticket appelé");
    } catch (error: any) {
      showError("Erreur", error?.response?.data?.message || "Erreur lors de l'appel");
    } finally { setIsActing(false); }
  };

  const handleMarkAbsent = async (ticketId: number, ticketNumber?: string) => {
    showWarning("Marquer absent", `Marquer le ticket ${ticketNumber ?? ticketId} comme absent ?`, "Marquer", async () => {
      setIsActing(true);
      try {
        await axiosClient.post(`/tickets/${ticketId}/mark-absent`);
        await fetchData();
        showSuccess("Succès", "Ticket marqué absent");
      } catch (error: any) { showError("Erreur", error?.response?.data?.message || "Erreur"); }
      finally { setIsActing(false); }
    }, "Annuler");
  };

  const handleRecall = async (ticketId: number) => {
    setIsActing(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/recall`);
      showSuccess("Rappel envoyé", "Client notifié");
    } catch (error: any) { showError("Erreur", error?.response?.data?.message || "Erreur"); }
    finally { setIsActing(false); }
  };

  const handleClose = async (ticketId: number) => {
    showWarning("Terminer", "Terminer ce service ?", "Terminer", async () => {
      setIsActing(true);
      try {
        await axiosClient.post(`/tickets/${ticketId}/close`);
        await fetchData();
        showSuccess("Terminé", "Ticket clôturé");
      } catch (error: any) { showError("Erreur", error?.response?.data?.message || "Erreur"); }
      finally { setIsActing(false); }
    }, "Annuler");
  };

  const handleOpenService = async () => {
    setIsActing(true);
    try {
      await axiosClient.post(`/services/${parseInt(serviceId || "0")}/open`);
      setServiceStatus("open");
      showSuccess("Succès", "Service ouvert");
    } catch (err: any) { showError("Erreur", err?.response?.data?.message || err?.message); }
    finally { setIsActing(false); }
  };

  const handleCloseService = async () => {
    setIsActing(true);
    try {
      await axiosClient.post(`/services/${parseInt(serviceId || "0")}/close`);
      setServiceStatus("closed");
      showSuccess("Succès", "Service fermé");
    } catch (err: any) { showError("Erreur", err?.response?.data?.message || err?.message); }
    finally { setIsActing(false); }
  };

  const handleCreateTicket = async () => {
    if (!serviceId) return;
    setIsCreating(true);
    try {
      await axiosClient.post("/agent/tickets", {
        service_id: parseInt(serviceId),
        priority: createForm.priority,
        priority_reason: createForm.priority_reason.trim() || undefined,
        customer_name: createForm.customer_name.trim() || undefined,
        customer_phone: createForm.customer_phone.trim() || undefined,
        is_senior: createForm.is_senior,
        is_handicap: createForm.is_handicap,
        is_pregnant: createForm.is_pregnant,
      });
      setShowCreateModal(false);
      setCreateForm({ priority: "normal", priority_reason: "", customer_name: "", customer_phone: "", is_senior: false, is_handicap: false, is_pregnant: false });
      await fetchData();
      showSuccess("Ticket créé", "Le ticket a été ajouté à la file");
    } catch (error: any) {
      showError("Erreur", error?.response?.data?.message || "Impossible de créer le ticket");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="hourglass-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: hPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>File d'attente</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Service #{serviceId}{counterId ? ` · Guichet ${counterId}` : ""}
            {smartQueue?.closing_time ? ` · Ferme à ${smartQueue.closing_time.substring(0, 5)}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.serviceToggle, { backgroundColor: serviceStatus === "open" ? "#34C759" : "#FF3B30", opacity: isActing ? 0.6 : 1 }]}
          onPress={() => serviceStatus === "open" ? handleCloseService() : handleOpenService()}
          disabled={isActing}
        >
          <Ionicons name={serviceStatus === "open" ? "checkmark-circle" : "close-circle"} size={12} color="#FFF" />
          <Text style={styles.serviceToggleText}>{serviceStatus === "open" ? "Ouvert" : "Fermé"}</Text>
        </TouchableOpacity>
      </View>

      {/* KPI en grille 2x2 */}
      {stats && (
        <View style={[styles.kpiGrid, { paddingHorizontal: hPad , marginTop:15,}]}>
          <View style={styles.kpiRow}>
            <KpiPill icon="people-outline" label="Attente" value={String(stats.waiting)} accent="#007AFF" colors={colors} />
            <KpiPill icon="checkmark-done-outline" label="Traités" value={String(stats.processed)} accent="#34C759" colors={colors} />
          </View>
          <View style={styles.kpiRow}>
            <KpiPill icon="timer-outline" label="Moyenne" value={stats.avg_wait_time > 0 ? `${Math.round(stats.avg_wait_time)}min` : "--"} accent="#FF9500" colors={colors} />
            {smartQueue && (
              <KpiPill
                icon={smartQueue.critical_zone ? "warning-outline" : "flash-outline"}
                label="Charge"
                value={smartQueue.estimated_load_minutes > 0
                  ? smartQueue.estimated_load_minutes >= 60
                    ? `${Math.floor(smartQueue.estimated_load_minutes / 60)}h${smartQueue.estimated_load_minutes % 60 > 0 ? (smartQueue.estimated_load_minutes % 60) + "m" : ""}`
                    : `${smartQueue.estimated_load_minutes}min`
                  : "—"}
                accent={smartQueue.critical_zone ? "#FF3B30" : "#8B5CF6"}
                colors={colors}
              />
            )}
          </View>
        </View>
      )}

      {smartQueue && serviceStatus === "open" && (
        <View style={{ paddingHorizontal: hPad, marginBottom: 6 }}>
          <SmartQueueBanner data={smartQueue} colors={colors} />
        </View>
      )}

      {currentTicket && (
        <View style={{ paddingHorizontal: hPad }}>
          <CurrentTicketCard
            ticket={currentTicket}
            onRecall={() => handleRecall(currentTicket.id)}
            onAbsent={() => handleMarkAbsent(currentTicket.id, currentTicket.number)}
            onClose={() => handleClose(currentTicket.id)}
            isActing={isActing}
            colors={colors}
          />
        </View>
      )}

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: hPad }]}>
        <Ionicons name="search" size={15} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Rechercher..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredTickets}
        renderItem={({ item, index }) => <TicketRow item={item} index={index} colors={colors} onAbsent={handleMarkAbsent} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: hPad, paddingTop: 6, paddingBottom: serviceStatus === "open" ? 108 : 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListHeaderComponent={filteredTickets.length > 0 ? (
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>File d'attente</Text>
            <View style={[styles.listHeaderBadge, { backgroundColor: smartQueue?.critical_zone ? "#FF3B3018" : "#007AFF18" }]}>
              <Text style={[styles.listHeaderBadgeText, { color: smartQueue?.critical_zone ? "#FF3B30" : "#007AFF" }]}>
                {filteredTickets.length} ticket{filteredTickets.length > 1 ? "s" : ""}
                {smartQueue?.critical_zone ? " ⚠" : ""}
              </Text>
            </View>
          </View>
        ) : null}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>File vide</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {smartQueue?.critical_zone ? "Zone critique — les nouveaux tickets sont reportés" : "Aucun ticket en attente"}
            </Text>
          </View>
        )}
      />

      {serviceStatus === "open" && (
        <View style={[styles.stickyButton, { backgroundColor: colors.background, borderTopColor: colors.border, paddingHorizontal: hPad }]}>
          <View style={styles.stickyRow}>
            <TouchableOpacity
              style={[styles.callButton, { flex: 1, backgroundColor: tickets.length === 0 || isActing ? colors.textSecondary : "#007AFF", opacity: tickets.length === 0 || isActing ? 0.6 : 1 }]}
              onPress={handleCallNext}
              disabled={tickets.length === 0 || isActing}
            >
              <Ionicons name="megaphone" size={18} color="#FFF" />
              <Text style={styles.callButtonText}>Appeler suivant</Text>
              {tickets.length > 0 && (
                <View style={styles.callButtonBadge}>
                  <Text style={styles.callButtonBadgeText}>{tickets.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: "#34C759" }]}
              onPress={() => setShowCreateModal(true)}
              disabled={isActing}
            >
              <Ionicons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CreateTicketModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreateTicket}
        isCreating={isCreating}
        colors={colors}
      />

      {AlertComponent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, fontSize: 14 },
  header: { flexDirection: "row", alignItems: "center", paddingBottom: 10, paddingTop: Platform.OS === "ios" ? 6 : (StatusBar.currentHeight ?? 6) + 4, borderBottomWidth: 1, gap: 8 },
  backBtn: { padding: 6 },
  headerTitle: { fontWeight: "700", fontSize: 17 },
  headerSub: { fontSize: 11, marginTop: 1 },
  serviceToggle: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 4 },
  serviceToggleText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  // KPI Grid 2x2
  kpiGrid: { marginBottom: 8 },
  kpiRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  kpiPill: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 8, gap: 7, borderWidth: 1 },
  kpiIcon: { width: 28, height: 28, borderRadius: 7, justifyContent: "center", alignItems: "center" },
  kpiValue: { fontWeight: "800", fontSize: 15, lineHeight: 18 },
  kpiLabel: { fontSize: 10, lineHeight: 13 },
  bannerWarning: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, gap: 9, borderWidth: 1 },
  bannerIconWarning: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FF3B3018", justifyContent: "center", alignItems: "center" },
  bannerTitleWarning: { color: "#FF3B30", fontWeight: "800", fontSize: 13 },
  bannerSubWarning: { color: "#FF3B30CC", fontSize: 11, marginTop: 1 },
  bannerNormal: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, gap: 9, borderWidth: 1 },
  bannerIconNormal: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#34C75918", justifyContent: "center", alignItems: "center" },
  bannerTitleNormal: { color: "#34C759", fontWeight: "800", fontSize: 13 },
  bannerSubNormal: { fontSize: 11, marginTop: 1 },
  bannerChip: { backgroundColor: "#007AFF18", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1, borderColor: "#007AFF30" },
  bannerChipText: { color: "#007AFF", fontSize: 11, fontWeight: "700" },
  currentCard: { marginBottom: 6, borderRadius: 12, overflow: "hidden", padding: 12, gap: 5 },
  currentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  currentIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(21, 12, 12, 0.15)", justifyContent: "center", alignItems: "center" },
  currentNumberContainer: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" },
  currentNumber: { color: "#FFF", fontWeight: "900", fontSize: 25 },
  currentStatusBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  currentStatusText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  currentStatusLine: { color: "rgba(255,255,255,0.82)", fontSize: 12, marginLeft: 46 },
  currentActions: { flexDirection: "row", justifyContent: "space-around", gap: 8, marginLeft: 46, marginTop: 4 },
  currentActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 8, borderRadius: 8 },
  currentActionText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 10, marginBottom: 4, marginTop: 2, paddingHorizontal: 10, paddingVertical: 10, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  listHeaderTitle: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  listHeaderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  listHeaderBadgeText: { fontSize: 12, fontWeight: "700" },
  ticketRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, marginBottom: 5, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 10, gap: 10 },
  ticketPosition: { width: 34, height: 34, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  ticketPositionText: { fontWeight: "800", fontSize: 14 },
  ticketHeaderRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5, marginBottom: 2 },
  ticketNumber: { fontWeight: "700", fontSize: 14 },
  ticketPriorityBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5 },
  ticketPriorityText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },
  ticketEtaBadge: { backgroundColor: "#007AFF12", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, borderWidth: 1, borderColor: "#007AFF28" },
  ticketEtaText: { color: "#007AFF", fontSize: 9, fontWeight: "700" },
  ticketMeta: { fontSize: 10, lineHeight: 13 },
  ticketStatusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  ticketStatusText: { fontSize: 9, fontWeight: "700" },
  ticketAbsentBtn: { width: 30, height: 30, borderRadius: 7, borderWidth: 1, borderColor: "#FF3B3028", justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontWeight: "700", fontSize: 15, marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },
  stickyButton: { position: "absolute", bottom: 80, left: 0, right: 0, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 28 : 16, borderTopWidth: 1 },
  stickyRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  callButton: { borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  callButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  callButtonBadge: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  callButtonBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  createBtn: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
});