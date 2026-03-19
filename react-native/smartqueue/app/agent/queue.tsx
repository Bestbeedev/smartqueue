import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import axiosClient from '../../src/api/axiosClient';
import { useFocusEffect } from '@react-navigation/native';

type Ticket = {
  id: number;
  number: string;
  status: string;
  position: number;
  priority: string;
  created_at: string;
  called_at?: string;
};

type ServiceStats = {
  waiting: number;
  processed: number;
  avg_wait_time: number;
};

export default function AgentQueue() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ serviceId: string; counterId: string }>();
  const serviceId = params.serviceId;
  const counterId = params.counterId;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<string>('closed');

  const fetchData = async () => {
    if (!serviceId) return;
    try {
      const [queueRes, statsRes, serviceRes] = await Promise.all([
        axiosClient.get(`/services/${serviceId}/queue`),
        axiosClient.get(`/services/${serviceId}/affluence`),
        axiosClient.get(`/services/${serviceId}`),
      ]);

      const waitingTickets = (queueRes.data?.tickets || [])
        .filter((t: Ticket) => t.status === 'waiting')
        .sort((a: Ticket, b: Ticket) => a.position - b.position);

      setTickets(waitingTickets);
      setStats({
        waiting: statsRes.data?.waiting || statsRes.data?.people || 0,
        processed: statsRes.data?.processed || 0,
        avg_wait_time: statsRes.data?.eta_avg || statsRes.data?.average_wait_time || 0,
      });
      setServiceStatus(serviceRes.data?.status || 'closed');

      // Find currently called ticket
      const calledTicket = (queueRes.data?.tickets || []).find((t: Ticket) => t.status === 'called');
      setCurrentTicket(calledTicket || null);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [serviceId])
  );

  const callNext = async () => {
    if (!serviceId) return;
    setIsActing(true);
    try {
      const payload: any = {};
      if (counterId) payload.counter_id = parseInt(counterId);
      
      await axiosClient.post(`/services/${parseInt(serviceId)}/call-next`, payload);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Erreur lors de l\'appel');
    } finally {
      setIsActing(false);
    }
  };

  const markAbsent = async (ticketId: number) => {
    setIsActing(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/mark-absent`);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Erreur');
    } finally {
      setIsActing(false);
    }
  };

  const recall = async (ticketId: number) => {
    setIsActing(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/recall`);
      Alert.alert('Succès', 'Rappel envoyé');
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Erreur');
    } finally {
      setIsActing(false);
    }
  };

  const closeTicket = async (ticketId: number) => {
    setIsActing(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/close`);
      setCurrentTicket(null);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Erreur');
    } finally {
      setIsActing(false);
    }
  };

  const toggleService = async () => {
    setIsActing(true);
    try {
      if (serviceStatus === 'open') {
        await axiosClient.post(`/services/${parseInt(serviceId)}/close`);
        setServiceStatus('closed');
      } else {
        await axiosClient.post(`/services/${parseInt(serviceId)}/open`);
        setServiceStatus('open');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Erreur');
    } finally {
      setIsActing(false);
    }
  };

  const renderTicket = ({ item, index }: { item: Ticket; index: number }) => (
    <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.ticketInfo}>
        <View style={[styles.ticketNumber, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.ticketNumberText, { color: colors.primary }]}>{item.number}</Text>
        </View>
        <View style={styles.ticketDetails}>
          <Text style={[styles.ticketPosition, { color: colors.textPrimary }]}>Position {item.position}</Text>
          <View style={[styles.priorityBadge, 
            item.priority === 'high' && { backgroundColor: '#FF9500' },
            item.priority === 'vip' && { backgroundColor: '#FFD60A' },
            item.priority === 'normal' && { backgroundColor: colors.textSecondary }
          ]}>
            <Text style={styles.priorityText}>{item.priority?.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>File d'attente</Text>
        <TouchableOpacity 
          style={[styles.statusToggle, { backgroundColor: serviceStatus === 'open' ? '#4CAF50' : '#FF5722' }]}
          onPress={toggleService}
          disabled={isActing}
        >
          <Text style={styles.statusToggleText}>{serviceStatus === 'open' ? 'Ouvert' : 'Fermé'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.waiting}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En attente</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.processed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Traités</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.avg_wait_time} min</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attente moy.</Text>
          </View>
        </View>
      )}

      {/* Current Called Ticket */}
      {currentTicket && (
        <View style={[styles.currentTicketCard, { backgroundColor: colors.primary }]}>
          <View style={styles.currentTicketHeader}>
            <Ionicons name="megaphone" size={24} color="white" />
            <Text style={styles.currentTicketLabel}>En cours d'appel</Text>
          </View>
          <Text style={styles.currentTicketNumber}>{currentTicket.number}</Text>
          <View style={styles.currentTicketActions}>
            <TouchableOpacity 
              style={styles.currentActionBtn}
              onPress={() => recall(currentTicket.id)}
            >
              <Ionicons name="volume-high" size={20} color="white" />
              <Text style={styles.currentActionText}>Rappeler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.currentActionBtn}
              onPress={() => markAbsent(currentTicket.id)}
            >
              <Ionicons name="person-remove" size={20} color="white" />
              <Text style={styles.currentActionText}>Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.currentActionBtn, styles.closeBtn]}
              onPress={() => closeTicket(currentTicket.id)}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.currentActionText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Call Next Button */}
      {!currentTicket && serviceStatus === 'open' && (
        <TouchableOpacity 
          style={[styles.callNextBtn, { backgroundColor: colors.primary }]}
          onPress={callNext}
          disabled={isActing || tickets.length === 0}
        >
          <Ionicons name="arrow-forward" size={24} color="white" />
          <Text style={styles.callNextText}>Appeler le suivant</Text>
        </TouchableOpacity>
      )}

      {/* Queue List */}
      <View style={styles.queueSection}>
        <Text style={[styles.queueTitle, { color: colors.textPrimary }]}>Prochains dans la file</Text>
        <FlatList
          data={tickets.slice(0, 10)}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun ticket en attente</Text>
            </View>
          }
          contentContainerStyle={styles.queueList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusToggleText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    margin: 16,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  currentTicketCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  currentTicketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentTicketLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  currentTicketNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
  },
  currentTicketActions: {
    flexDirection: 'row',
    gap: 12,
  },
  currentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  currentActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  callNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  callNextText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  queueSection: {
    flex: 1,
    padding: 16,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  queueList: {
    paddingBottom: 100,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ticketNumberText: {
    fontWeight: '700',
    fontSize: 14,
  },
  ticketDetails: {
    marginLeft: 12,
    flex: 1,
  },
  ticketPosition: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
