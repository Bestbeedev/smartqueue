import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { establishmentsApi, Establishment } from '../../api/establishmentsApi';
import { ticketsApi } from '../../api/ticketsApi';
import { useAuth } from '../../store/authStore';
import { useTicket } from '../../store/ticketStore';
import { useDistanceTracking } from '../../hooks/useDistanceTracking';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { formatDistance, formatTravelTime } from '../../utils/distance';

interface ServiceData {
  description: ReactNode;
  id: number;
  name: string;
  status: string;
  avg_service_time_minutes: number;
  people_waiting: number;
}

interface EstablishmentData extends Establishment {
  total_people_waiting?: number;
  services?: ServiceData[];
}

export const ServiceDetailsScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const establishmentId = Number(params.establishmentId);
  const serviceId = params.serviceId ? Number(params.serviceId) : undefined;
  const fromQr = params.fromQr === 'true';
  const { isAuthenticated } = useAuth();
  const { hasActiveTicket, activeTicket, refreshActiveTicket } = useTicket();
  const { AlertComponent, showError, showInfo, showWarning } = useCustomAlert();

  const [establishment, setEstablishment] = useState<EstablishmentData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(serviceId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Distance tracking
  const { distanceInfo, hasPermission: hasLocationPermission } = useDistanceTracking({
    targetCoordinates: establishment && establishment.lat != null && establishment.lng != null ? {
      latitude: establishment.lat,
      longitude: establishment.lng,
    } : null,
    enabled: !!establishment && establishment.lat != null && establishment.lng != null,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [estData, servicesData] = await Promise.all([
        establishmentsApi.getEstablishment(establishmentId),
        establishmentsApi.getEstablishmentServices(establishmentId),
      ]);
      setEstablishment(estData);
      // Services are now embedded in establishment response
      const servicesList = estData.services || servicesData || [];
      setServices(Array.isArray(servicesList) ? servicesList : (servicesList as any)?.data || []);
      if (!selectedServiceId && servicesList && (servicesList as ServiceData[]).length > 0) {
        const firstOpen = (servicesList as ServiceData[]).find(s => s.status === 'open');
        if (firstOpen) setSelectedServiceId(firstOpen.id);
      }
    } catch (error) {
      console.error('Error loading establishment:', error);
      showError('Erreur', 'Impossible de charger les détails de l\'établissement.');
    } finally {
      setIsLoading(false);
    }
  }, [establishmentId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoinQueue = async () => {
    if (!isAuthenticated) {
      showInfo(
        'Connexion requise',
        'Vous devez être connecté pour rejoindre une file d\'attente.',
        'Se connecter',
        () => router.push('/onboarding')
      );
      return;
    }

    if (hasActiveTicket && activeTicket) {
      showWarning(
        'Ticket actif',
        'Vous avez déjà un ticket actif. Voulez-vous le suivre ?',
        'Voir mon ticket',
        () => router.push({
          pathname: '/(tabs)/live-ticket',
          params: { ticketId: String(activeTicket.id) },
        }),
        'Annuler'
      );
      return;
    }

    if (!selectedServiceId) {
      showError('Sélection requise', 'Veuillez choisir un service avant de rejoindre la file.');
      return;
    }

    setIsJoining(true);
    try {
      const ticket = await ticketsApi.createTicket({
        establishment_id: establishmentId,
        service_id: selectedServiceId,
        from_qr: fromQr,
      });
      
      // Extract ticket data (API wraps in {data: ...})
      const ticketData = (ticket as any)?.data || ticket;
      
      // Update store with ticket data so position is set correctly
      const { useTicketStore } = require('../../store/ticketStore');
      useTicketStore.getState().setActiveTicket(ticketData);

      router.push({
        pathname: '/(tabs)/live-ticket',
        params: { ticketId: String(ticketData.id) },
      });
    } catch (error: any) {
      // API returns errors in format: {error: {message: ...}} or {message: ...}
      const apiError = error?.response?.data?.error || error?.response?.data;
      const message = apiError?.message || error?.message || 'Impossible de rejoindre la file.';
      showError('Erreur', message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleGetDirections = () => {
    if (!establishment) return;
    const { lat, lng, address } = establishment;
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${address}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${address}`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    if (!establishment) return;
    try {
      await Share.share({
        title: establishment.name,
        message: `Rejoignez la file d'attente virtuelle de ${establishment.name} sur SmartQueue!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isOpenNow = (establishment: Establishment) => {
    if (!establishment.open_at || !establishment.close_at) return null;
    const now = new Date();
    const [openH, openM] = establishment.open_at.split(':').map(Number);
    const [closeH, closeM] = establishment.close_at.split(':').map(Number);
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;
    return currentTime >= openTime && currentTime <= closeTime;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!establishment) return null;

  //const isOpen = isOpenNow(establishment);

  return (
    <View className="flex-1 bg-white">
      {AlertComponent}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces>
        {/* Banner Image Section */}
        <View className="relative h-80 bg-gray-200">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80' }} // Simulated clinical image
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-x-0 top-0 pt-12 px-5 flex-row justify-between z-10">
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center rounded-full bg-white/30" 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-white/30">
              <Ionicons name="heart-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section with Rounded Corners */}
        <View className="bg-white -mt-8 rounded-t-3xl px-5 pt-8">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{establishment.name}</Text>
              <Text className="text-gray-400 text-sm mt-1">{establishment.address}</Text>
            </View>
          </View>

          {/* Crowd level indicator row */}
          <View className="flex-row mt-6 mb-4 justify-between">
            {['low', 'moderate', 'high'].map((level) => (
              <View 
                key={level}
                className={`flex-1 mx-1 p-3 rounded-2xl items-center border ${
                  establishment.crowd_level === level 
                    ? level === 'low' ? 'bg-green-50 border-green-200' : level === 'moderate' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <View className={`w-2 h-2 rounded-full mb-1 ${
                  level === 'low' ? 'bg-green-500' : level === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${
                  establishment.crowd_level === level 
                    ? level === 'low' ? 'text-green-600' : level === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                    : 'text-gray-400'
                }`}>
                  {level}
                </Text>
              </View>
            ))}
          </View>

          {/* Total People in Queue */}
          <View className="mb-6 bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-orange-100 items-center justify-center">
                  <Ionicons name="people" size={24} color="#F97316" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-sm">Personnes en rang</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {establishment.total_people_waiting ?? 0}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-gray-400 text-xs">dans tout l&apos;établissement</Text>
                <Text className="text-orange-600 font-semibold text-sm">
                  {services.length} service{services.length > 1 ? 's' : ''} actif{services.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Distance Info */}
          {distanceInfo && hasLocationPermission && (
            <View className="mb-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <View className="flex-row items-center mb-3">
                <Ionicons name="location" size={20} color="#3B82F6" />
                <Text className="text-blue-600 font-bold ml-2">Distance</Text>
              </View>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Ionicons name="navigate" size={18} color="#6B7280" />
                  <Text className="text-gray-900 font-bold text-lg mt-1">
                    {formatDistance(distanceInfo.kilometers)}
                  </Text>
                  <Text className="text-gray-400 text-xs">Distance</Text>
                </View>
                <View className="items-center flex-1">
                  <Ionicons name="walk" size={18} color="#6B7280" />
                  <Text className="text-gray-900 font-bold text-lg mt-1">
                    {formatTravelTime(distanceInfo.travelTimes.walking)}
                  </Text>
                  <Text className="text-gray-400 text-xs">À pied</Text>
                </View>
                <View className="items-center flex-1">
                  <Ionicons name="bicycle" size={18} color="#6B7280" />
                  <Text className="text-gray-900 font-bold text-lg mt-1">
                    {formatTravelTime(distanceInfo.travelTimes.motorcycle)}
                  </Text>
                  <Text className="text-gray-400 text-xs">Moto</Text>
                </View>
                <View className="items-center flex-1">
                  <Ionicons name="car" size={18} color="#6B7280" />
                  <Text className="text-gray-900 font-bold text-lg mt-1">
                    {formatTravelTime(distanceInfo.travelTimes.car)}
                  </Text>
                  <Text className="text-gray-400 text-xs">Voiture</Text>
                </View>
              </View>
            </View>
          )}

          {/* Service Selection */}
          {services.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Choisissez un service</Text>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  className={`flex-row items-center p-4 rounded-xl mb-2 border ${
                    selectedServiceId === service.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                  onPress={() => setSelectedServiceId(service.id)}
                >
                  <View className="flex-1">
                    <Text className={`font-semibold ${selectedServiceId === service.id ? 'text-blue-600' : 'text-gray-900'}`}>
                      {service.name}
                    </Text>
                    {service.description && (
                      <Text className="text-gray-500 text-sm mt-1">{service.description}</Text>
                    )}
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="people-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-xs ml-1">
                        {service.people_waiting ?? 0} dans la file d&apos;attente
                      </Text>
                      {service.avg_service_time_minutes && (
                        <>
                          <Ionicons name="time-outline" size={14} color="#6B7280" className="ml-3" />
                          <Text className="text-gray-500 text-xs ml-1">~{service.avg_service_time_minutes} min/service</Text>
                        </>
                      )}
                    </View>
                  </View>
                  {selectedServiceId === service.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Join Queue Button */}
          <TouchableOpacity 
            className={`w-full h-16 rounded-2xl flex-row items-center justify-center mb-8 ${isJoining ? 'bg-blue-400' : 'bg-blue-600 shadow-lg shadow-blue-300'}`}
            onPress={handleJoinQueue}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="enter-outline" size={24} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">Joindre la file</Text>
              </>
            )}
          </TouchableOpacity>

          {/* General Information Section */}
          <View className="mb-10">
            <Text className="text-xl font-bold text-gray-900 mb-4">Information Generale </Text>
            
            <View className="bg-gray-50 rounded-2xl p-4">
              <TouchableOpacity className="flex-row items-center border-b border-gray-100 pb-4 mb-4">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Ionicons name="call-outline" size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">Telephone</Text>
                  <Text className="text-gray-500 text-sm">{(establishment as any).phone || '+33 1 23 45 67 89'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Ionicons name="globe-outline" size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">Site web</Text>
                  <Text className="text-gray-500 text-sm">{(establishment as any).website || 'www.centralclinic.com'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ServiceDetailsScreen;
