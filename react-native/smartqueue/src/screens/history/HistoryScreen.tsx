import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ticketsApi, Ticket } from '../../api/ticketsApi';
import { TabParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useTicket } from '../../store/ticketStore';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { router } from 'expo-router';

type HistoryNavigationProp = NativeStackNavigationProp<TabParamList, 'History'>;

// Types pour les filtres
type FilterType = 'weekly' | 'monthly' | 'custom';
type StatusFilter = 'all' | 'active' | 'waiting' | 'called' | 'completed' | 'cancelled' | 'expired';

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
}

interface StatusOption {
  id: StatusFilter;
  label: string;
  color: string;
}

// Composant HistoryScreen
export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryNavigationProp>();
  const { hasActiveTicket, activeTicket, setActiveTicket, isCalled, counterNumber } = useTicket();
  const { AlertComponent, showSuccess, showError } = useCustomAlert();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('weekly');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Refs pour éviter les boucles de dépendances
  const pageRef = React.useRef(1);
  const hasMoreRef = React.useRef(true);
  const isLoadingRef = React.useRef(false);
  const onEndReachedCalledDuringMomentumRef = React.useRef(true);
  const lastEndReachedAtRef = React.useRef(0);

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

  // Status filter options
  const statusOptions: StatusOption[] = [
    { id: 'all', label: 'Tous', color: '#6B7280' },
    { id: 'active', label: 'Actifs', color: '#2563EB' },
    { id: 'waiting', label: 'En attente', color: '#F59E0B' },
    { id: 'called', label: 'Appelés', color: '#10B981' },
    { id: 'completed', label: 'Terminés', color: '#059669' },
    { id: 'cancelled', label: 'Annulés', color: '#EF4444' },
    { id: 'expired', label: 'Expirés', color: '#6B7280' },
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

  // Charger les tickets - version stable sans dépendances changeantes
  const loadTickets = useCallback(async (reset: boolean = false) => {
    // Utiliser une ref pour vérifier l'état sans causer de re-render
    if (isLoadingRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getFilterDates();
      const currentPage = reset ? 1 : pageRef.current;
      
      console.log('[HistoryScreen] Loading tickets:', { startDate, endDate, page: currentPage, status: selectedStatus });
      
      const response = await ticketsApi.getTicketHistory({
        from: startDate,
        to: endDate,
        page: currentPage,
        per_page: 20,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });

      console.log('[HistoryScreen] Response:', JSON.stringify(response).substring(0, 500));

      // Laravel API wraps data in 'data' key
      const newTickets = response.data || [];
      
      console.log('[HistoryScreen] Tickets found:', newTickets.length);
      
      if (reset) {
        setTickets(newTickets);
        pageRef.current = 2;
      } else {
        setTickets(prev => [...prev, ...newTickets]);
        pageRef.current = currentPage + 1;
      }
      
      // Laravel pagination is in 'meta' key
      const pagination = response.meta || (response as any).pagination;
      hasMoreRef.current = pagination ? pagination.current_page < pagination.last_page : false;
    } catch (error: any) {
      console.error('[HistoryScreen] Error:', error.response?.status, error.response?.data, error.message);
      const errorMessage = error.response?.data?.message || 'Impossible de charger l\'historique des tickets.';
      setError(errorMessage);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [getFilterDates, selectedStatus]);

  // Effet pour charger les tickets au montage et quand le filtre change
  useEffect(() => {
    // Réinitialiser les refs quand le filtre change
    pageRef.current = 1;
    hasMoreRef.current = true;
    isLoadingRef.current = false;
    onEndReachedCalledDuringMomentumRef.current = true;
    lastEndReachedAtRef.current = 0;
    loadTickets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, selectedStatus]);

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      onEndReachedCalledDuringMomentumRef.current = true;
      lastEndReachedAtRef.current = 0;
      await loadTickets(true);
    } catch (error) {
      console.error('Error refreshing tickets:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger plus de tickets (infinite scroll)
  const handleLoadMore = () => {
    if (onEndReachedCalledDuringMomentumRef.current) return;
    const now = Date.now();
    if (now - lastEndReachedAtRef.current < 800) return;
    lastEndReachedAtRef.current = now;

    if (!isLoadingRef.current && hasMoreRef.current) {
      onEndReachedCalledDuringMomentumRef.current = true;
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
      showSuccess(
        'Ticket Created',
        `Your ticket ${newTicket.number} was created for ${ticket.service?.name || 'Service'}.`,
        'OK',
        () => navigation.navigate('tickets' as any)
      );
    } catch (error) {
      console.error('Error rejoining queue:', error);
      showError('Error', 'Impossible de rejoindre la file.');
    }
  };

  // Rendu du footer
  const renderFooter = () => {
    if (!hasMoreRef.current) return null;
    
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
        Aucun ticket terminé
      </Text>
      <Text className="text-gray-500 text-center mb-10">
        Les tickets apparaissent ici une fois servis, annulés ou expirés.
      </Text>
      {hasActiveTicket && activeTicket ? (
        <TouchableOpacity 
          className="bg-blue-600 px-8 py-4 rounded-2xl flex-row items-center"
          onPress={() => router.push('/(tabs)/live-ticket')}
        >
          <Ionicons name="ticket-outline" size={20} color="white" />
          <Text className="text-white font-bold ml-2">Voir mon ticket actif</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          className="bg-blue-600 px-8 py-4 rounded-2xl flex-row items-center"
          onPress={() => router.push('/(tabs)/tickets')}
        >
          <Ionicons name="qr-code-outline" size={20} color="white" />
          <Text className="text-white font-bold ml-2">Scanner un QR Code</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Active ticket card component
  const renderActiveTicketCard = () => {
    console.log('[HistoryScreen] renderActiveTicketCard - hasActiveTicket:', hasActiveTicket, 'activeTicket:', activeTicket?.id);
    if (!hasActiveTicket || !activeTicket) return null;
    
    return (
      <TouchableOpacity 
        className="mx-5 mb-4 bg-blue-600 rounded-3xl p-5 shadow-lg"
        onPress={() => router.push('/(tabs)/live-ticket')}
        style={{ backgroundColor: '#2563EB' }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Ticket actif
            </Text>
            <Text className="text-white text-xl font-bold mt-1">
              {activeTicket.establishment?.name || 'Établissement'}
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              {activeTicket.service?.name || 'Service'}
            </Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold text-lg">{activeTicket.number}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center justify-between bg-white/10 rounded-2xl p-3 mt-2">
          <View className="items-center flex-1">
            <Ionicons name="people" size={18} color="white" />
            <Text className="text-white font-bold text-lg mt-1">{activeTicket.position || '-'}</Text>
            <Text className="text-white/60 text-xs">Position</Text>
          </View>
          <View className="items-center flex-1">
            <Ionicons name={isCalled ? "notifications" : "hourglass"} size={18} color="white" />
            <Text className="text-white font-bold text-lg mt-1">
              {isCalled ? 'Appelé!' : 'En attente'}
            </Text>
            <Text className="text-white/60 text-xs">
              {isCalled ? `Guichet ${counterNumber || ''}` : 'Statut'}
            </Text>
          </View>
          <View className="items-center flex-1">
            <Ionicons name="arrow-forward" size={18} color="white" />
            <Text className="text-white font-bold text-lg mt-1">Voir</Text>
            <Text className="text-white/60 text-xs">Détails</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 40 }}
        >
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status.id}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedStatus === status.id 
                  ? 'bg-gray-800' 
                  : 'bg-gray-100'
              }`}
              onPress={() => {
                setSelectedStatus(status.id);
                setExpandedTickets(new Set());
              }}
            >
              <Text className={`font-semibold ${
                selectedStatus === status.id ? 'text-white' : 'text-gray-600'
              }`}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentumRef.current = false;
        }}
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
        ListHeaderComponent={
          selectedStatus === 'all' && hasActiveTicket && activeTicket ? (
            <>
              {renderActiveTicketCard()}
              {tickets.length > 0 && (
                <Text className="text-lg font-bold text-gray-900 mb-3 mx-5 mt-2">Tous les tickets</Text>
              )}
            </>
          ) : tickets.length > 0 ? (
            <Text className="text-lg font-bold text-gray-900 mb-3 mx-5 mt-4">
              {selectedStatus === 'active' ? 'Tickets actifs' :
               selectedStatus === 'completed' ? 'Tickets terminés' :
               selectedStatus === 'waiting' ? 'En attente' :
               selectedStatus === 'called' ? 'Appelés' :
               selectedStatus === 'cancelled' ? 'Annulés' :
               selectedStatus === 'expired' ? 'Expirés' : 'Tickets'}
            </Text>
          ) : null
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? () => (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : error ? (
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
          ) : (selectedStatus === 'all' && hasActiveTicket && activeTicket) ? null : renderEmptyState
        }
        renderItem={({ item: ticket }) => {
          const isExpanded = expandedTickets.has(ticket.id);
          const waitTime = getWaitTime(ticket);
          
          return (
            <View className="bg-white rounded-3xl p-5 mb-4 mx-5 shadow-sm border border-gray-100">
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
                    <Text className="text-blue-600 font-bold ml-2">Joindre la file</Text>
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
