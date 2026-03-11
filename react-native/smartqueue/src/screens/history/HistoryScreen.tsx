import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ticketsApi, Ticket } from '../../api/ticketsApi';
import { TabParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type HistoryNavigationProp = NativeStackNavigationProp<TabParamList, 'History'>;

// Types pour les filtres
type FilterType = 'weekly' | 'monthly' | 'custom';

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
}

// Composant HistoryScreen
export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryNavigationProp>();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('weekly');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres disponibles
  const filters: FilterOption[] = [
    {
      id: 'weekly',
      label: 'Weekly',
      icon: <Ionicons name="calendar-outline" size={16} />,
    },
    {
      id: 'monthly',
      label: 'Monthly',
      icon: <Ionicons name="calendar-number-outline" size={16} />,
    },
    {
      id: 'custom',
      label: 'Custom',
      icon: <Ionicons name="options-outline" size={16} />,
    },
  ];

  // Obtenir les dates selon le filtre
  const getFilterDates = useCallback(() => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    
    let startDate: string;
    
    switch (selectedFilter) {
      case 'weekly': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      }
      case 'monthly': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      }
      case 'custom': {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate = threeMonthsAgo.toISOString().split('T')[0];
        break;
      }
      default: {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }
    }
    
    return { startDate, endDate };
  }, [selectedFilter]);

  // Charger les tickets
  const loadTickets = useCallback(async (reset: boolean = false) => {
    if (isLoading || (!hasMore && !reset)) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getFilterDates();
      const currentPage = reset ? 1 : page;
      
      const response = await ticketsApi.getTicketHistory({
        from: startDate,
        to: endDate,
        page: currentPage,
        per_page: 20,
      });

      const newTickets = response.data;
      
      if (reset) {
        setTickets(newTickets);
        setPage(2);
      } else {
        setTickets(prev => [...prev, ...newTickets]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.pagination.current_page < response.pagination.last_page);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      const errorMessage = error.response?.data?.message || 'Impossible de charger l\'historique des tickets.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, getFilterDates]);

  // Effet pour charger les tickets au montage et quand le filtre change
  useEffect(() => {
    loadTickets(true);
  }, [selectedFilter, loadTickets]);

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTickets(true);
    } catch (error) {
      console.error('Error refreshing tickets:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger plus de tickets (infinite scroll)
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadTickets(false);
    }
  };

  // Basculer l'expansion d'un ticket
  const toggleTicketExpansion = (ticketId: number) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'closed':
      case 'served':
        return 'Done';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      case 'absent':
        return 'Absent';
      case 'called':
        return 'Called';
      case 'waiting':
        return 'Waiting';
      default:
        return status;
    }
  };

  // Calculer la durée d'attente
  const getWaitTime = (ticket: Ticket) => {
    if (!ticket.created_at || !ticket.closed_at) return null;
    
    const created = new Date(ticket.created_at);
    const closed = new Date(ticket.closed_at);
    const diffMs = closed.getTime() - created.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    return `${diffMins} min`;
  };

  // Rejoindre à nouveau la file
  const handleRejoinQueue = async (ticket: Ticket) => {
    if (!ticket.service_id) return;
    
    try {
      const newTicket = await ticketsApi.rejoinQueue(ticket.service_id);
      Alert.alert(
        'Ticket Created',
        `Your ticket ${newTicket.number} was created for ${ticket.service?.name || 'Service'}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('tickets' as any),
          },
        ]
      );
    } catch (error) {
      console.error('Error rejoining queue:', error);
      Alert.alert('Error', 'Impossible de rejoindre la file.');
    }
  };

  // Rendu du footer
  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View className="py-8 items-center">
        {isLoading ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Load More...
          </Text>
        )}
      </View>
    );
  };

  // Rendu de l'état vide
  const renderEmptyState = () => (
        <View className="items-center py-20 px-10">
      <Ionicons
        name="time-outline"
        size={80}
        color="#E5E7EB"
      />
      <Text className="text-xl font-bold text-gray-900 mt-6 mb-2 text-center">
        No tickets found
      </Text>
      <Text className="text-gray-500 text-center mb-10">
        You haven&apos;t joined any queues in this period.
      </Text>
      <TouchableOpacity 
        className="bg-blue-600 px-8 py-4 rounded-2xl flex-row items-center"
        onPress={() => navigation.navigate('tickets' as any)}
      >
        <Ionicons name="qr-code-outline" size={20} color="white" />
        <Text className="text-white font-bold ml-2">Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Ticket History</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
                selectedFilter === filter.id 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'bg-gray-100 border-gray-100'
              }`}
              onPress={() => {
                setSelectedFilter(filter.id);
                setExpandedTickets(new Set());
              }}
            >
              {React.cloneElement(filter.icon as React.ReactElement<any>, { 
                color: selectedFilter === filter.id ? 'white' : '#6B7280' 
              })}
              <Text className={`ml-2 font-semibold ${selectedFilter === filter.id ? 'text-white' : 'text-gray-500'}`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={error ? () => (
          <View className="items-center py-20 px-10">
            <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
            <Text className="text-xl font-bold text-gray-900 mt-6 mb-2 text-center">
              Oups ! Une erreur est survenue
            </Text>
            <Text className="text-gray-500 text-center mb-10">
              {error.includes('401') ? 'Veuillez vous reconnecter pour voir votre historique.' : error}
            </Text>
            <TouchableOpacity 
              className="bg-blue-600 px-8 py-4 rounded-2xl flex-row items-center"
              onPress={() => loadTickets(true)}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : renderEmptyState}
        renderItem={({ item: ticket }) => {
          const isExpanded = expandedTickets.has(ticket.id);
          const waitTime = getWaitTime(ticket);
          
          return (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
              <TouchableOpacity
                className="flex-row justify-between items-start"
                onPress={() => toggleTicketExpansion(ticket.id)}
                activeOpacity={0.7}
              >
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                    {ticket.establishment?.name || 'Establishment'}
                  </Text>
                  <Text className="text-gray-500 font-medium mb-1">
                    {ticket.service?.name || 'Service'}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                
                <View className="items-end">
                  <View className={`px-3 py-1 rounded-full mb-2 ${
                    ticket.status === 'served' || ticket.status === 'closed' 
                      ? 'bg-green-100' 
                      : (ticket.status as string) === 'cancelled' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      ticket.status === 'served' || ticket.status === 'closed' 
                        ? 'text-green-600' 
                        : (ticket.status as string) === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {getStatusText(ticket.status)}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View className="mt-4 pt-4 border-t border-gray-50 gap-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-400">Ticket Number</Text>
                    <Text className="text-gray-900 font-bold">{ticket.number}</Text>
                  </View>
                  {waitTime && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">Wait Duration</Text>
                      <Text className="text-gray-900 font-bold">{waitTime}</Text>
                    </View>
                  )}
                  {ticket.counter_id && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400">Counter</Text>
                      <Text className="text-gray-900 font-bold">{ticket.counter_id}</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    className="mt-2 bg-blue-50 py-3 rounded-2xl flex-row items-center justify-center"
                    onPress={() => handleRejoinQueue(ticket)}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#2563EB" />
                    <Text className="text-blue-600 font-bold ml-2">Rejoin Queue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default HistoryScreen;
