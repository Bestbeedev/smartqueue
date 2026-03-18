import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import axiosClient from '../../src/api/axiosClient';
import { useFocusEffect } from '@react-navigation/native';

type Ticket = {
  id: number;
  number: string;
  status: string;
  absent_at: string | null;
  created_at: string;
  service_name?: string;
};

export default function AbsentTickets() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!serviceId) return;
    try {
      const response = await axiosClient.get('/agent/tickets', {
        params: {
          service_id: parseInt(serviceId),
          status: 'absent',
          per_page: 50,
        },
      });
      setTickets(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching absent tickets:', error);
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.ticketHeader}>
        <View style={[styles.ticketNumber, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.ticketNumberText}>{item.number}</Text>
        </View>
        <View style={styles.ticketMeta}>
          <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
            {formatDate(item.absent_at || item.created_at)}
          </Text>
          <Text style={[styles.ticketTime, { color: colors.textSecondary }]}>
            {formatTime(item.absent_at || item.created_at)}
          </Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: '#FF3B30' + '20' }]}>
        <Ionicons name="person-remove" size={16} color="#FF3B30" />
        <Text style={[styles.statusText, { color: '#FF3B30' }]}>Marqué absent</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="person-remove" size={24} color="#FF3B30" />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tickets absents</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.countText}>{tickets.length}</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: '#FF3B30' + '10' }]}>
        <Ionicons name="information-circle" size={20} color="#FF3B30" />
        <Text style={[styles.infoText, { color: '#FF3B30' }]}>
          Liste des usagers qui n'ont pas répondu à l'appel
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun absent</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tous les usagers ont répondu présents
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketNumber: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ticketNumberText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  ticketMeta: {
    alignItems: 'flex-end',
  },
  ticketDate: {
    fontSize: 12,
  },
  ticketTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
