import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useAuth } from '../../src/store/authStore';
import axiosClient from '../../src/api/axiosClient';

type Service = {
  id: number;
  name: string;
  status: string;
  avg_service_time_minutes?: number;
  people_waiting?: number;
};

type Counter = {
  id: number;
  name: string;
  status: string;
};

export default function AgentHome() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const assignedServices = (user as any)?.services || [];
  const assignedCounters = (user as any)?.counters || [];

  const loadData = async () => {
    try {
      // Load stats for each assigned service
      const servicesWithStats = await Promise.all(
        assignedServices.map(async (s: Service) => {
          try {
            const response = await axiosClient.get(`/services/${s.id}/affluence`);
            return {
              ...s,
              people_waiting: response.data?.waiting || response.data?.people || 0,
            };
          } catch {
            return { ...s, people_waiting: 0 };
          }
        })
      );
      setServices(servicesWithStats);
      setCounters(assignedCounters);
      
      // Auto-select first service if available
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

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToQueue = () => {
    if (selectedService) {
      router.push(`/agent/queue?serviceId=${selectedService.id}&counterId=${selectedCounter?.id || ''}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Bonjour,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="person" size={16} color={colors.primary} />
          <Text style={[styles.roleText, { color: colors.primary }]}>Agent</Text>
        </View>
      </View>

      {/* Service Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Service assigné</Text>
        <FlatList
          data={services}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.serviceCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedService?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedService(item)}
            >
              <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="layers" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'open' ? '#4CAF50' : '#FF5722' }]}>
                <Text style={styles.statusText}>{item.status === 'open' ? 'Ouvert' : 'Fermé'}</Text>
              </View>
              <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
                {item.people_waiting} en attente
              </Text>
            </TouchableOpacity>
          )}
          style={styles.servicesList}
        />
      </View>

      {/* Counter Selection */}
      {counters.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Guichet</Text>
          <FlatList
            data={counters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.counterCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedCounter?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setSelectedCounter(item)}
              >
                <Ionicons name="desktop-outline" size={20} color={colors.primary} />
                <Text style={[styles.counterName, { color: colors.text }]}>{item.name}</Text>
                <View style={[styles.counterStatus, { backgroundColor: item.status === 'open' ? '#4CAF50' : '#9E9E9E' }]}>
                  <Text style={styles.counterStatusText}>{item.status === 'open' ? 'Ouvert' : 'Fermé'}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.countersList}
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions rapides</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={navigateToQueue}
          disabled={!selectedService}
        >
          <Ionicons name="list" size={24} color="white" />
          <Text style={styles.actionButtonText}>Gérer la file d'attente</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.smallActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/agent/called?serviceId=' + selectedService?.id)}
            disabled={!selectedService}
          >
            <Ionicons name="megaphone-outline" size={24} color="#FF9500" />
            <Text style={[styles.smallActionText, { color: colors.text }]}>Appelés</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/agent/absent?serviceId=' + selectedService?.id)}
            disabled={!selectedService}
          >
            <Ionicons name="person-remove-outline" size={24} color="#FF3B30" />
            <Text style={[styles.smallActionText, { color: colors.text }]}>Absents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/agent/priority?serviceId=' + selectedService?.id)}
            disabled={!selectedService}
          >
            <Ionicons name="star-outline" size={24} color="#FFD60A" />
            <Text style={[styles.smallActionText, { color: colors.text }]}>Priorité</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      {selectedService && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistiques</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{selectedService.people_waiting || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En attente</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{selectedService.avg_service_time_minutes || 5} min</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps moyen</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  servicesList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  serviceCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 12,
  },
  countersList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    gap: 8,
  },
  counterName: {
    fontSize: 14,
    fontWeight: '500',
  },
  counterStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
  },
});
