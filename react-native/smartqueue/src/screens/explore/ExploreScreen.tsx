import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { useGeolocation } from "../../hooks/useGeolocation";
import { establishmentsApi, Establishment } from "../../api/establishmentsApi";
import { Theme } from "../../theme";
import { TabParamList } from "../../navigation/types";
import { useThemeColors } from "../../hooks/useThemeColors";
import { Badge } from "../../components/ui/Badge";
import { CustomBottomSheet } from "../../components/ui/BottomSheet";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import "../../../global.css";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { useTicket } from "../../store/ticketStore";
import { ActiveTicketCard } from "../../components/ActiveTicketCard";

// Types pour les filtres
type FilterType = "all" | "banks" | "clinics" | "pharmacies" | "gov";

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
}

// Composant ExploreScreen
export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TabParamList, "Explore">>();
  const colors = useThemeColors();
  const { location, getCurrentPosition } = useGeolocation();
  const { hasActiveTicket, activeTicket } = useTicket();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<
    Establishment[]
  >([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566, // Paris par défaut
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedEstablishment, setSelectedEstablishment] =
    useState<Establishment | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Recenter on user
  const recenter = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location]);

  // Filtres disponibles
  const filters: FilterOption[] = [
    {
      id: "all",
      label: "Tous",
      icon: (
        <Ionicons
          name="grid-outline"
          size={16}
          color={Theme.colors.textSecondary}
        />
      ),
    },
    {
      id: "banks",
      label: "Banques",
      icon: (
        <Ionicons
          name="business-outline"
          size={16}
          color={Theme.colors.textSecondary}
        />
      ),
    },
    {
      id: "clinics",
      label: "Cliniques",
      icon: (
        <Ionicons
          name="medical-outline"
          size={16}
          color={Theme.colors.textSecondary}
        />
      ),
    },
    {
      id: "pharmacies",
      label: "Pharmacies",
      icon: (
        <Ionicons
          name="medkit-outline"
          size={16}
          color={Theme.colors.textSecondary}
        />
      ),
    },
    {
      id: "gov",
      label: "Services",
      icon: (
        <Ionicons
          name="build-outline"
          size={16}
          color={Theme.colors.textSecondary}
        />
      ),
    },
  ];

  // Charger les établissements
  const loadEstablishments = useCallback(async () => {
    let currentLat = 48.8566; // Default to Paris
    let currentLng = 2.3522;

    if (!location) {
      const currentLocation = await getCurrentPosition();
      if (currentLocation) {
        currentLat = currentLocation.latitude;
        currentLng = currentLocation.longitude;
      } else {
        Alert.alert(
          "Localisation requise",
          "Veuillez autoriser la localisation pour trouver les établissements proches.",
        );
        // Continue with default location if permission denied or location not available
      }
    } else {
      currentLat = location.latitude;
      currentLng = location.longitude;
    }

    setIsLoading(true);
    try {
      const data = await establishmentsApi.getEstablishments({
        lat: currentLat,
        lng: currentLng,
        type: selectedFilter === "all" ? undefined : selectedFilter,
        q: searchQuery || undefined,
      });

      setEstablishments(data);
      setFilteredEstablishments(data);

      // Mettre à jour la région de la carte
      if (data.length > 0 || location) { // Update map region if data is available or location is known
        setMapRegion({
          latitude: currentLat,
          longitude: currentLng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error("Error loading establishments:", error);
      Alert.alert(
        "Erreur",
        "Impossible de charger les établissements. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [location, selectedFilter, searchQuery, getCurrentPosition]);

  // Effet initial pour charger la position si non disponible
  useEffect(() => {
    if (!location) {
      getCurrentPosition();
    }
  }, [location, getCurrentPosition]);

  // Effet pour charger les établissements quand la position ou les filtres changent
  useEffect(() => {
    loadEstablishments();
  }, [location?.latitude, location?.longitude, selectedFilter, searchQuery, loadEstablishments]);

  // Effet pour filtrer les établissements
  useEffect(() => {
    let filtered = establishments;

    // Filtrer par type
    if (selectedFilter !== "all") {
      filtered = filtered.filter((est) => est.category === selectedFilter);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (est) =>
          est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          est.address.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredEstablishments(filtered);
  }, [establishments, selectedFilter, searchQuery]);

  // Obtenir la couleur du marqueur selon le niveau d'affluence
  const getMarkerColor = (crowdLevel?: string) => {
    switch (crowdLevel) {
      case "low":
        return Theme.colors.crowdLow;
      case "moderate":
        return Theme.colors.crowdModerate;
      case "high":
        return Theme.colors.crowdBusy;
      default:
        return colors.primary;
    }
  };

  // Gérer le tap sur un marqueur
  const handleMarkerPress = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setShowBottomSheet(true);
  };

  // Gérer le tap sur une carte
  const handleEstablishmentPress = (establishment: Establishment) => {
    router.push({
      pathname: '/service-details',
      params: {
        establishmentId: String(establishment.id),
        serviceId: '',
        fromQr: 'false',
      },
    });
  };

  // Rendu d'un marqueur
  const renderMarker = (establishment: Establishment) => {
    const lat = Number(establishment.lat);
    const lng = Number(establishment.lng);

    if (isNaN(lat) || isNaN(lng)) return null;

    return (
      <Marker
        key={establishment.id}
        coordinate={{
          latitude: lat,
          longitude: lng,
        }}
        onPress={() => handleMarkerPress(establishment)}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center border-2 border-white shadow-md"
          style={{ backgroundColor: getMarkerColor(establishment.crowd_level) }}
        >
          <Ionicons name="location" size={18} color="#FFFFFF" />
        </View>
      </Marker>
    );
  };

  // Rendu d'un établissement dans la liste
  const renderEstablishment = ({ item }: { item: Establishment }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white rounded-2xl mb-3 shadow-sm"
      onPress={() => handleEstablishmentPress(item)}
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: getMarkerColor(item.crowd_level) + "20" }}
      >
        <Ionicons
          name={
            item.category === "banks"
              ? "business"
              : item.category === "clinics"
                ? "medical"
                : "build"
          }
          size={24}
          color={getMarkerColor(item.crowd_level)}
        />
      </View>

      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
          {item.address}
        </Text>
        <View className="flex-row items-center mt-2">
          {item.avg_wait_min && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {item.avg_wait_min} min wait
              </Text>
            </View>
          )}
          {item.people_waiting !== undefined && (
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {item.people_waiting} personne dans le rang
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="items-end ml-2">
        <Badge variant={(item.crowd_level as any) || "moderate"} size="small">
          {item.crowd_level || "moderate"}
        </Badge>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#9CA3AF"
          className="mt-2"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Search Header - iOS Style */}
      <View className="px-5 pt-12 pb-4 bg-white shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity className="flex-row items-center bg-gray-100 px-3 py-2 rounded-full">
            <Ionicons name="location-sharp" size={16} color={colors.primary} />
            <Text
              className="ml-1 text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {location ? "Ma position" : "Localisation..."}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={colors.textSecondary}
              className="ml-1"
            />
          </TouchableOpacity>

          <TouchableOpacity className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full">
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
            <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </TouchableOpacity>
        </View>

        {/* Search Input Container */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textTertiary}
          />
          <TextInput
            className="flex-1 ml-2 text-base"
            style={{ color: colors.textPrimary } as any}
            placeholder="Search banks, clinics..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories / Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
                selectedFilter === filter.id
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <Ionicons
                name={
                  filter.id === "all"
                    ? "grid-outline"
                    : filter.id === "banks"
                      ? "business-outline"
                      : filter.id === "clinics"
                        ? "medical-outline"
                        : filter.id === "pharmacies"
                          ? "medkit-outline"
                          : "build-outline"
                }
                size={16}
                color={
                  selectedFilter === filter.id
                    ? "#FFFFFF"
                    : colors.textSecondary
                }
              />
              <Text
                className={`ml-2 font-medium ${
                  selectedFilter === filter.id ? "text-white" : "text-gray-600"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1 bg-gray-200 mt-2">
        <MapView
          ref={mapRef}
          className="flex-1"
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={!!location}
        >
          {filteredEstablishments.map(renderMarker)}

          {(!location || isNaN(Number(location.latitude)) || isNaN(Number(location.longitude))) ? null : (
            <Marker
              coordinate={{
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
              }}
              pinColor={Theme.colors.primary}
            />
          )}
        </MapView>

        {/* Floating actions on map */}
        <View style={{ position: 'absolute', right: 20, top: 20 }}>
          <TouchableOpacity
            onPress={recenter}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
            style={{ marginBottom: 12 }}
          >
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Indicateur de chargement */}
        {isLoading && (
          <View className="absolute inset-0 bg-white/60 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
      {/* Liste des établissements (always visible below map) */}
      <View className="flex-1 bg-white pt-4 rounded-t-3xl shadow-lg" style={{ marginTop: -20, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
        <View className="px-5 pb-2 mb-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xl font-bold text-gray-900">
              Établissements
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Trier</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-400">
            {filteredEstablishments.length} résultats trouvés
          </Text>
        </View>

        <FlatList
          data={filteredEstablishments}
          renderItem={renderEstablishment}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 w-full" />
          )}
          ListHeaderComponent={
            hasActiveTicket && activeTicket ? (
              <View className="mb-4">
                <ActiveTicketCard
                  onPress={() => router.push({
                    pathname: '/(tabs)/live-ticket',
                    params: { ticketId: String(activeTicket.id) },
                  })}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-10 items-center px-10">
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text className="text-lg font-bold text-gray-900 mt-4 text-center">
                Aucun établissement
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-5">
                Essayez de modifier votre recherche
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

// Styles
export default ExploreScreen;
