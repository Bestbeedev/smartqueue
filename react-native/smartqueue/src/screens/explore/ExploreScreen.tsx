import React, { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView 
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useCustomAlert } from "../../hooks/useCustomAlert";
import { establishmentsApi, Establishment } from "../../api/establishmentsApi";
import { Theme } from "../../theme";
import { useThemeColors } from "../../hooks/useThemeColors";
import { Badge } from "../../components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import "../../../global.css";
import { useTicket } from "../../store/ticketStore";
import { ActiveTicketCard } from "../../components/ActiveTicketCard";
// Types pour les filtres
type FilterType = "all" | "banks" | "clinics" | "pharmacies" | "gov";



// Composant ExploreScreen
export const ExploreScreen: React.FC = () => {

  const colors = useThemeColors();
  const { location, getCurrentPosition } = useGeolocation();
  const [placeName, setPlaceName] = useState<string | null>(null);
  const { hasActiveTicket, activeTicket, fetchActiveTicket, isInitialized } = useTicket();
  const { AlertComponent, showError, showInfo } = useCustomAlert();

  // Debug log
  useEffect(() => {
    console.log('[ExploreScreen] State:', { hasActiveTicket, isInitialized, activeTicketId: activeTicket?.id });
  }, [hasActiveTicket, isInitialized, activeTicket]);

  // Fetch fresh ticket data on mount to avoid showing stale data from other users
  useEffect(() => {
    console.log('[ExploreScreen] Fetching active ticket...');
    fetchActiveTicket().catch(err => console.error('Error fetching active ticket:', err));
  }, []);

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<
    Establishment[]
  >([]);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] =
    useState<Establishment | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Recenter on user
  const recenter = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  }, [location]);

  //Effet recuperer region par default
  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

//Ajouter le reverse geocoding
useEffect(() => {
  const fetchPlaceName = async () => {
    if (!location) return;

    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (result.length > 0) {
        const place = result[0];

        const normalize = (str?: string) =>
          str
            ? str.toLowerCase().replace(/[-\s]+/g, "").trim()
            : "";

        const city = place.city?.trim();
        const subregion = place.subregion?.trim();
        const district = place.district?.trim();
        const region = place.region?.trim();
        const primary = district || subregion || city;
        const secondary = city || region;

        let name = "";

        if (
          primary &&
          secondary &&
          normalize(primary) !== normalize(secondary)
        ) {
          name = `${primary}, ${secondary}`;
        } else {
          name = primary || secondary || place.country || "Ma position";
        }

        setPlaceName(name);
      }
    } catch (error) {
      console.log("Reverse geocode error", error);
      setPlaceName("Ma position");
    }
  };

  fetchPlaceName();
}, [location]);


  // Charger les établissements
  const loadEstablishments = useCallback(async () => {
    let currentLocation = location;

    if (!currentLocation) {
      currentLocation = await getCurrentPosition();
    }

    if (!currentLocation) {
      showError(
        "Localisation requise",
        "Veuillez autoriser la localisation pour trouver les établissements proches.",
      );
      return;
    }

    const currentLat = currentLocation.latitude;
    const currentLng = currentLocation.longitude;

    setIsLoading(true);

    try {
      const data = await establishmentsApi.getEstablishments({
        lat: currentLat,
        lng: currentLng,
        q: searchQuery || undefined,
      });

      if (data && data.length > 0) {
        setEstablishments(data);
        setFilteredEstablishments(data);
      } else {
        // Empty response - still set empty arrays
        setEstablishments([]);
        setFilteredEstablishments([]);
      }

      // Mettre à jour la région de la carte
      if (data.length > 0 || location) { // Update map region if data is available or location is known
        setMapRegion({
          latitude: currentLat,
          longitude: currentLng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error: any) {
      console.error("Error loading establishments:", error?.response?.status, error?.message);
      // Only show alert if it's a network/auth error, not if it's a backend issue
      if (error?.response?.status === 401 || error?.code === 'NETWORK_ERROR' || !error?.response) {
        showError(
          "Erreur",
          "Impossible de charger les établissements. Vérifiez votre connexion.",
        );
      } else {
        // For other errors (500, 404, etc), just log and show empty state
        setEstablishments([]);
        setFilteredEstablishments([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [location, getCurrentPosition, showError, searchQuery]);

  // Effet initial pour charger la position si non disponible
  useEffect(() => {
    if (!location) {
      getCurrentPosition();
    }
  }, [location, getCurrentPosition]);

  // Effet pour charger les établissements quand la position ou les filtres changent
  useEffect(() => {
    loadEstablishments();
  }, [location?.latitude, location?.longitude, searchQuery, loadEstablishments]);

  // Effet pour filtrer les établissements
  useEffect(() => {
    let filtered = establishments;

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (est) =>
          est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          est.address.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredEstablishments(filtered);
  }, [establishments, searchQuery]);

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
      pathname: "/service-details",
      params: {
        establishmentId: String(establishment.id),
        serviceId: "",
        fromQr: "false",
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
          <TouchableOpacity onPress={()=>getCurrentPosition()} className="flex-row items-center bg-blue-200/50 border-blue-200 border px-3 py-2 rounded-full">
            <Ionicons name="location-sharp" size={16} color={colors.primary} />
            <Text
              className="ml-1 text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {/* {location ? "Ma position" : "Localisation..."} */}
              {placeName || "Localisation en cours..."}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={colors.textSecondary}
              className="ml-1"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center bg-blue-200/50 border-blue-200 border rounded-full"
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
            <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </TouchableOpacity>
        </View>

        {/* Search Input Container */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4">
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textTertiary}
          />
          <TextInput
            className="flex-1 ml-2 text-base"
            style={{ color: colors.textPrimary } as any}
            placeholder="Rechercher un etablissement ..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories / Filters - Shows actual establishment names */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {/* Filtre “Tous” */}
          <TouchableOpacity
            onPress={() => setSelectedFilter("all")}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
              selectedFilter === "all"
                ? "bg-blue-600 border-blue-600"
                : "bg-white border-gray-200"
            }`}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={
                selectedFilter === "all" ? "#FFFFFF" : colors.textSecondary
              }
            />
            <Text
              className={`ml-2 font-medium ${
                selectedFilter === "all" ? "text-white" : "text-gray-600"
              }`}
            >
              Tous
            </Text>
          </TouchableOpacity>

          {/* Filtre dynamique : établissements proches */}
          {filteredEstablishments.map((est) => (
            <TouchableOpacity
              key={est.id}
              onPress={() =>
                router.push({
                  pathname: "/service-details",
                  params: {
                    establishmentId: String(est.id),
                    serviceId: "",
                    fromQr: "false",
                  },
                })
              }
              className="flex-row items-center px-4 py-2 rounded-full mr-2 border bg-white border-gray-200"
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                className="ml-2 font-medium text-gray-600"
                numberOfLines={1}
              >
                {est.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1 bg-gray-200 mt-2">
        {mapRegion && (
          <MapView
            provider={PROVIDER_DEFAULT}
            ref={mapRef}
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={!!location}
          >
            {filteredEstablishments.map(renderMarker)}

            {!location ||
            isNaN(Number(location.latitude)) ||
            isNaN(Number(location.longitude)) ? null : (
              <Marker
                coordinate={{
                  latitude: Number(location.latitude),
                  longitude: Number(location.longitude),
                }}
                pinColor={Theme.colors.primary}
              />
            )}
          </MapView>
        )}

        {/* Floating actions on map */}
        <View style={{ position: "absolute", right: 20, top: 20 }}>
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
      <View
        className="flex-1 bg-white pt-4 rounded-t-3xl shadow-lg"
        style={{
          marginTop: -100,
          elevation: 15,
          shadowColor: "#000",
          borderWidth: 1,
          borderColor: "#E5E5E5",
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
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
            isInitialized && hasActiveTicket && activeTicket ? (
              <View className="mb-4">
                <ActiveTicketCard
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/live-ticket",
                      params: { ticketId: String(activeTicket.id) },
                    })
                  }
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
      {AlertComponent}
    </View>
  );
};

// Styles
export default ExploreScreen;
