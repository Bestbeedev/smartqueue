import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useCustomAlert } from '../../src/hooks/useCustomAlert';
import axiosClient from '../../src/api/axiosClient';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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
  const { AlertComponent, showSuccess, showWarning, showError, showInfo } = useCustomAlert();
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
      showSuccess('Appel réussi', 'Le prochain ticket a été appelé');
    } catch (error: any) {
      showError('Erreur', error?.response?.data?.message || 'Erreur lors de l\'appel');
    } finally {
      setIsActing(false);
    }
  };

  const markAbsent = async (ticketId: number, ticketNumber: string) => {
    showWarning(
      'Marquer absent',
      `Voulez-vous marquer le ticket ${ticketNumber} comme absent ?`,
      'Marquer absent',
      async () => {
        setIsActing(true);
        try {
          await axiosClient.post(`/tickets/${ticketId}/mark-absent`);
          await fetchData();
          showSuccess('Succès', 'Ticket marqué comme absent');
        } catch (error: any) {
          showError('Erreur', error?.response?.data?.message || 'Erreur');
        } finally {
          setIsActing(false);
        }
      },
      'Annuler'
    );
  };

  const recall = async (ticketId: number) => {
    setIsActing(true);
    try {
      await axiosClient.post(`/tickets/${ticketId}/recall`);
      showSuccess('Rappel envoyé', 'Le client a été notifié');
    } catch (error: any) {
      showError('Erreur', error?.response?.data?.message || 'Erreur');
    } finally {
      setIsActing(false);
    }
  };

  const closeTicket = async (ticketId: number, ticketNumber: string) => {
    showWarning(
      'Terminer le service',
      `Voulez-vous terminer le service pour le ticket ${ticketNumber} ?`,
      'Terminer',
      async () => {
        setIsActing(true);
        try {
          await axiosClient.post(`/tickets/${ticketId}/close`);
          setCurrentTicket(null);
          await fetchData();
          showSuccess('Service terminé', 'Le ticket a été clôturé');
        } catch (error: any) {
          showError('Erreur', error?.response?.data?.message || 'Erreur');
        } finally {
          setIsActing(false);
        }
      },
      'Annuler'
    );
  };

  const toggleService = async () => {
    const newStatus = serviceStatus === 'open' ? 'closed' : 'open';
    showWarning(
      newStatus === 'open' ? 'Ouvrir le service' : 'Fermer le service',
      newStatus === 'open' 
        ? 'Voulez-vous ouvrir ce service ? Les clients pourront prendre des tickets.'
        : 'Voulez-vous fermer ce service ? Aucun nouveau ticket ne pourra être pris.',
      newStatus === 'open' ? 'Ouvrir' : 'Fermer',
      async () => {
        setIsActing(true);
        try {
          if (serviceStatus === 'open') {
            await axiosClient.post(`/services/${parseInt(serviceId)}/close`);
          } else {
            await axiosClient.post(`/services/${parseInt(serviceId)}/open`);
          }
          setServiceStatus(newStatus);
          showSuccess('Succès', `Service ${newStatus === 'open' ? 'ouvert' : 'fermé'}`);
        } catch (error: any) {
          showError('Erreur', error?.response?.data?.message || 'Erreur');
        } finally {
          setIsActing(false);
        }
      },
      'Annuler'
    );
  };

  const renderTicket = ({ item, index }: { item: Ticket; index: number }) => (
    <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.ticketInfo}>
        <View style={styles.ticketNumber}>
          <Text style={styles.ticketNumberText}>{item.number}</Text>
        </View>
        <View style={styles.ticketDetails}>
          <Text style={styles.ticketPosition}>Position {item.position}</Text>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>{item.priority?.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.ticketTime}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.ticketTimeText}>
          {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>File d'attente</Text>
        <TouchableOpacity 
          style={[styles.statusToggle, { backgroundColor: serviceStatus === 'open' ? '#22C55E' : '#EF4444' }]}
          onPress={toggleService}
          disabled={isActing}
        >
          <Ionicons name={serviceStatus === 'open' ? 'checkmark-circle' : 'close-circle'} size={16} color="white" />
          <Text style={styles.statusToggleText}>{serviceStatus === 'open' ? 'Ouvert' : 'Fermé'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="people" size={20} color="white" />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.waiting}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En attente</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#22C55E15' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#22C55E' }]}>
              <Ionicons name="checkmark-done" size={20} color="white" />
            </View>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.processed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Traités</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F59E0B15' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="timer" size={20} color="white" />
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.avg_wait_time}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Min. moy.</Text>
          </View>
        </View>
      )}

      {/* Current Called Ticket */}
      {currentTicket && (
        <View style={[styles.currentTicketCard, { backgroundColor: colors.primary }]}>
          <View style={styles.currentTicketHeader}>
            <View style={styles.currentTicketIcon}>
              <Ionicons name="megaphone" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.currentTicketLabel}>Ticket en cours</Text>
              <Text style={styles.currentTicketNumber}>{currentTicket.number}</Text>
            </View>
          </View>
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
              onPress={() => markAbsent(currentTicket.id, currentTicket.number)}
            >
              <Ionicons name="person-remove" size={20} color="white" />
              <Text style={styles.currentActionText}>Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.currentActionBtn, styles.closeBtn]}
              onPress={() => closeTicket(currentTicket.id, currentTicket.number)}
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
          {tickets.length > 0 && (
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>{tickets.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Queue List */}
      <View style={styles.queueSection}>
        <View style={styles.queueHeader}>
          <Text style={[styles.queueTitle, { color: colors.text }]}>Prochains dans la file</Text>
          <Text style={[styles.queueCount, { color: colors.textSecondary }]}>{tickets.length} tickets</Text>
        </View>
        <FlatList
          data={tickets.slice(0, 10)}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>File vide</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun ticket en attente</Text>
            </View>
          }
          contentContainerStyle={styles.queueList}
        />
      </View>

      {AlertComponent}
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
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusToggleText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  currentTicketCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  currentTicketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  currentTicketIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTicketLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  currentTicketNumber: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
  },
  currentTicketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  currentActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  closeBtn: {
    backgroundColor: '#22C55E',
  },
  currentActionText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  callNextBtn: {
    margin: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  callNextText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  queueBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  queueBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  queueSection: {
    flex: 1,
    padding: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  queueCount: {
    fontSize: 14,
  },
  queueList: {
    paddingBottom: 20,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketNumber: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ticketDetails: {
    gap: 4,
  },
  ticketPosition: {
    fontSize: 15,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  ticketTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketTimeText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 4,
  },
});
