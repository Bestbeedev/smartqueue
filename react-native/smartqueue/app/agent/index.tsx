import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useAuth } from '../../src/store/authStore';
import { useCustomAlert } from '../../src/hooks/useCustomAlert';
import axiosClient from '../../src/api/axiosClient';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type AffluenceData = {
  level: 'low' | 'medium' | 'high';
  people: number;
  eta_avg: number;
  hourly_data?: { hour: number; count: number }[];
  peak_hours?: { high: number[]; medium: number[]; low: number[] };
};

type Service = {
  id: number;
  name: string;
  status: string;
  avg_service_time_minutes?: number;
  people_waiting?: number;
  affluence?: AffluenceData;
};

type Counter = {
  id: number;
  name: string;
  status: string;
};

type PerformanceData = {
  daily: {
    date: string;
    total: number;
    closed: number;
    absent: number;
  }[];
  total_closed: number;
  total_absent: number;
  avg_service_time: number | null;
};

export default function AgentHome() {
  const colors = useThemeColors();
  const { user, logout } = useAuth();
  const { AlertComponent, showWarning, showError } = useCustomAlert();
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTogglingCounter, setIsTogglingCounter] = useState(false);
  const [weeklyPerformance, setWeeklyPerformance] = useState<PerformanceData | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const loadData = async () => {
    try {
      const assignedServices = (user as any)?.services || [];
      const assignedCounters = (user as any)?.counters || [];
      
      if (assignedServices.length === 0) {
        setServices([]);
        setIsLoading(false);
        return;
      }
      
      const servicesWithStats = await Promise.all(
        assignedServices.map(async (s: Service) => {
          try {
            const response = await axiosClient.get(`/services/${s.id}/affluence`);
            return {
              ...s,
              people_waiting: response.data?.people || 0,
              affluence: {
                level: response.data?.level || 'low',
                people: response.data?.people || 0,
                eta_avg: response.data?.eta_avg || 0,
                hourly_data: response.data?.hourly_data,
                peak_hours: response.data?.peak_hours,
              },
            };
          } catch {
            return { ...s, people_waiting: 0, affluence: { level: 'low' as const, people: 0, eta_avg: 0 } };
          }
        })
      );
      setServices(servicesWithStats);
      setCounters(assignedCounters);
      
      if (servicesWithStats.length > 0 && !selectedService) {
        setSelectedService(servicesWithStats[0]);
      }
      if (assignedCounters.length > 0 && !selectedCounter) {
        setSelectedCounter(assignedCounters[0]);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWeeklyPerformance = async () => {
    try {
      const response = await axiosClient.get('/agent/dashboard/performance');
      setWeeklyPerformance(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      fetchWeeklyPerformance();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    fetchWeeklyPerformance();
  };

  const navigateToProfile = () => router.push('/agent/profile');
  const navigateToStats = () => router.push('/agent/stats');

  const toggleCounter = async (counter: Counter) => {
    if (isTogglingCounter) return;
    setIsTogglingCounter(true);
    try {
      const isOpening = counter.status !== 'open';
      const endpoint = isOpening ? `/counters/${counter.id}/open` : `/counters/${counter.id}/close`;
      await axiosClient.post(endpoint);
      
      setCounters(prev => prev.map(c => 
        c.id === counter.id ? { ...c, status: isOpening ? 'open' : 'closed' } : c
      ));
      if (selectedCounter?.id === counter.id) {
        setSelectedCounter({ ...counter, status: isOpening ? 'open' : 'closed' });
      }
    } catch (error: any) {
      showError('Erreur', error?.response?.data?.message || 'Impossible de modifier le statut');
    } finally {
      setIsTogglingCounter(false);
    }
  };

  const navigateToQueue = () => {
    if (!selectedService) {
      showError('Erreur', 'Veuillez sélectionner un service');
      return;
    }
    router.push(`/agent/queue?serviceId=${selectedService.id}${selectedCounter ? `&counterId=${selectedCounter.id}` : ''}`);
  };

  const navigateToCalled = () => {
    if (!selectedService) {
      showError('Erreur', 'Veuillez sélectionner un service');
      return;
    }
    router.push(`/agent/called?serviceId=${selectedService.id}`);
  };

  const navigateToAbsent = () => {
    if (!selectedService) {
      showError('Erreur', 'Veuillez sélectionner un service');
      return;
    }
    router.push(`/agent/absent?serviceId=${selectedService.id}`);
  };

  const navigateToPriority = () => {
    if (!selectedService) {
      showError('Erreur', 'Veuillez sélectionner un service');
      return;
    }
    router.push(`/agent/priority?serviceId=${selectedService.id}`);
  };

  const AFFLUENCE_LABELS = { high: 'Élevée', medium: 'Modérée', low: 'Faible' } as const;

  const renderServiceItem = ({ item }: { item: Service }) => {
    const affLevel = item.affluence?.level || 'low';
    const affColor = AFFLUENCE_COLORS[affLevel];
    return (
      <TouchableOpacity
        style={[
          styles.serviceCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          selectedService?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
        ]}
        onPress={() => setSelectedService(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="layers-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.serviceName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'open' ? '#4CAF50' : '#FF5722' }]} />
        <View style={[styles.affluenceBadge, { backgroundColor: affColor + '20', borderColor: affColor + '40' }]}>
          <View style={[styles.affluenceDot, { backgroundColor: affColor }]} />
          <Text style={[styles.affluenceBadgeText, { color: affColor }]}>{AFFLUENCE_LABELS[affLevel]}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCounterItem = ({ item }: { item: Counter }) => (
    <View style={[
      styles.counterCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
      selectedCounter?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
    ]}>
      <TouchableOpacity
        style={styles.counterContent}
        onPress={() => setSelectedCounter(item)}
      >
        <View style={[styles.counterIcon, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="desktop-outline" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.counterName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.counterToggle, { backgroundColor: item.status === 'open' ? '#4CAF50' : '#9E9E9E' }]}
        onPress={() => toggleCounter(item)}
        disabled={isTogglingCounter}
      >
        <Text style={styles.counterStatusText}>{item.status === 'open' ? 'Ouvert' : 'Fermé'}</Text>
      </TouchableOpacity>
    </View>
  );

  const AFFLUENCE_COLORS = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#34C759',
  } as const;

  const formatPeakHours = (hours?: number[]) => {
    if (!hours || hours.length === 0) return null;
    return hours.map(h => `${String(h).padStart(2, '0')}h`).join(', ');
  };

  const getInsightData = () => {
    if (!selectedService) return null;
    const aff = selectedService.affluence;
    const level = aff?.level || 'low';
    const peopleWaiting = aff?.people || selectedService.people_waiting || 0;
    const avgTime = selectedService.avg_service_time_minutes || 5;
    const ac = AFFLUENCE_COLORS[level];
    const peakHours = formatPeakHours(aff?.peak_hours?.high);
    const calmHours = formatPeakHours(aff?.peak_hours?.low);

    if (level === 'high') {
      return {
        message: `⚠️ ${peopleWaiting} personnes en attente — affluence élevée`,
        subtext: peakHours ? `Heures de pointe : ${peakHours}` : undefined,
        emoji: '😟',
        color: ac,
      };
    }
    if (level === 'medium') {
      return {
        message: `⚠️ ${peopleWaiting} personnes — affluence modérée`,
        subtext: peakHours ? `Heures de pointe : ${peakHours}` : undefined,
        emoji: '😐',
        color: ac,
      };
    }
    if (avgTime > 10) {
      return { message: `⏱ Temps de service élevé (${avgTime} min)`, emoji: '😕', color: '#FF9500', subtext: undefined };
    }
    return {
      message: '✅ Bonne affluence, temps de service normal',
      subtext: calmHours ? `Meilleurs créneaux : ${calmHours}` : undefined,
      emoji: '😊',
      color: ac,
    };
  };

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const todayData = weeklyPerformance?.daily?.[weeklyPerformance.daily.length - 1];
  const completionRate = todayData && todayData.total > 0
    ? Math.round((todayData.closed / todayData.total) * 100)
    : 0;

  const insight = getInsightData();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header compact */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'Agent'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="person" size={14} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role === 'admin' ? 'Admin' : 'Agent'}</Text>
          </View>
          <TouchableOpacity onPress={navigateToProfile} style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Services assignés - compact */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mes services</Text>
        {services.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun service assigné</Text>
          </View>
        ) : (
          <FlatList
            data={services}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderServiceItem}
            contentContainerStyle={styles.servicesList}
          />
        )}
      </View>

      {/* Guichets */}
      {counters.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mes guichets</Text>
          <FlatList
            data={counters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCounterItem}
            contentContainerStyle={styles.countersList}
          />
        </View>
      )}

      {/* Actions rapides compactes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Actions Rapides</Text>
        
        <TouchableOpacity style={[styles.primaryAction, { backgroundColor: colors.primary }]} onPress={navigateToQueue} activeOpacity={0.7}>
          <Ionicons name="list-outline" size={22} color="#FFF" />
          <Text style={styles.primaryActionText}>Gérer la file</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.primaryAction, { backgroundColor: '#8B5CF6' }]} onPress={navigateToStats} activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" size={22} color="#FFF" />
          <Text style={styles.primaryActionText}>Statistiques</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={navigateToCalled}>
            <Ionicons name="megaphone-outline" size={22} color="#FF9500" />
            <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Appelés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={navigateToAbsent}>
            <Ionicons name="person-remove-outline" size={22} color="#FF3B30" />
            <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Absents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallAction, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={navigateToPriority}>
            <Ionicons name="star-outline" size={22} color="#FFD60A" />
            <Text style={[styles.smallActionText, { color: colors.textPrimary }]}>Priorité</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Mini Chart */}
      {weeklyPerformance && weeklyPerformance.daily && weeklyPerformance.daily.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tickets cette semaine</Text>
          <View style={[styles.weeklyChartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.barsRow}>
              {weeklyPerformance.daily.map((day, index) => {
                const maxClosed = Math.max(...weeklyPerformance.daily.map(d => d.closed), 1);
                const barHeight = (day.closed / maxClosed) * 60;
                return (
                  <View key={day.date} style={styles.barColumn}>
                    <View style={[styles.bar, { height: barHeight, backgroundColor: colors.primary, opacity: 0.7 + (day.closed / maxClosed) * 0.3 }]} />
                    <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{dayLabels[index] || ''}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.weeklySummary, { color: colors.textSecondary }]}>
              {weeklyPerformance.total_closed} tickets traités cette semaine
            </Text>
          </View>
        </View>
      )}

      {/* Statistiques compactes */}
      {selectedService && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Stats</Text>
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{selectedService.affluence?.people ?? selectedService.people_waiting || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En attente</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{selectedService.avg_service_time_minutes || 5} min</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps moyen</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <View style={[styles.ring, { borderColor: completionRate >= 50 ? '#4CAF50' : '#FF9500' }]}>
                <Text style={[styles.ringText, { color: colors.textPrimary }]}>{completionRate}%</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taux complétion</Text>
            </View>
          </View>
        </View>
      )}

      {/* Smart Insight Bar */}
      {selectedService && insight && (
        <View style={styles.section}>
          <View style={[styles.insightCard, { backgroundColor: insight.color + '15', borderColor: insight.color + '40' }]}>
            <Text style={[styles.insightText, { color: insight.color }]}>{insight.emoji} {insight.message}</Text>
            {insight.subtext && (
              <Text style={[styles.insightSubtext, { color: insight.color + 'CC' }]}>{insight.subtext}</Text>
            )}
          </View>
        </View>
      )}

      {AlertComponent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: 13 },
  userName: { fontSize: 22, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4 },
  roleText: { fontSize: 13, fontWeight: '600' },
  profileBtn: { padding: 2 },
  
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12,marginTop:20 },
  
  servicesList: { paddingRight: 20 },
  serviceCard: { width: 120, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', marginRight: 10 },
  serviceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  serviceName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  affluenceBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, gap: 3 },
  affluenceDot: { width: 6, height: 6, borderRadius: 3 },
  affluenceBadgeText: { fontSize: 9, fontWeight: '600' },
  
  emptyCard: { padding: 20, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500', marginTop: 10 },
  
  countersList: { paddingRight: 20 },
  counterCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, marginRight: 10, gap: 6 },
  counterContent: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  counterIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  counterName: { fontSize: 13, fontWeight: '500' },
  counterToggle: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  counterStatusText: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  
  primaryAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 10, gap: 10 },
  primaryActionText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' ,alignItems:'center',},
  smallAction: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  smallActionText: { fontSize: 11, fontWeight: '500' },
  
  statsRow: { flexDirection: 'row', paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignContent: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 8 },

  weeklyChartCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  barColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 16, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 4 },
  weeklySummary: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 10 },

  ring: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 11, fontWeight: '700' },

  insightCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  insightText: { fontSize: 13, fontWeight: '500' },
  insightSubtext: { fontSize: 11, marginTop: 4, lineHeight: 15 },
});
