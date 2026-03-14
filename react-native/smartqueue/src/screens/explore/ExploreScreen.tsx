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
  }, [fetchActiveTicket]);

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
      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}
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
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
          {item.address}
        </Text>
        <View className="flex-row items-center mt-2">
          {item.avg_wait_min && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>
                {item.avg_wait_min} min wait
              </Text>
            </View>
          )}
          {item.people_waiting !== undefined && (
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
              <Text style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search Header - iOS Style */}
      <View style={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={()=>getCurrentPosition()} 
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', borderColor: colors.primary + '30', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
          >
            <Ionicons name="location-sharp" size={16} color={colors.primary} />
            <Text style={{ marginLeft: 4, fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {placeName || "Localisation en cours..."}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '20', borderColor: colors.primary + '30', borderWidth: 1, borderRadius: 999 }}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: colors.danger, borderRadius: 4, borderWidth: 1, borderColor: colors.surface }} />
          </TouchableOpacity>
        </View>

        {/* Search Input Container */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: 16, paddingHorizontal: 16 }}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16, color: colors.textPrimary }}
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
          style={{ marginTop: 16 }}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {/* Filtre "Tous" */}
          <TouchableOpacity
            onPress={() => setSelectedFilter("all")}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
              marginRight: 8,
              borderWidth: 1,
              backgroundColor: selectedFilter === "all" ? colors.primary : colors.surface,
              borderColor: selectedFilter === "all" ? colors.primary : colors.border,
            }}
          >
            <Ionicons name="grid-outline" size={16} color={selectedFilter === "all" ? '#FFFFFF' : colors.textSecondary} />
            <Text style={{
              marginLeft: 8,
              fontWeight: '500',
              color: selectedFilter === "all" ? '#FFFFFF' : colors.textSecondary,
            }}>
              Tous
            </Text>
          </TouchableOpacity>

          {/* Filtre dynamique : établissements proches */}
          {filteredEstablishments.slice(0, 3).map((est) => (
            <TouchableOpacity
              key={est.id}
              onPress={() => router.push({
                pathname: "/service-details",
                params: { establishmentId: String(est.id), serviceId: "", fromQr: "false" },
              })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                marginRight: 8,
                borderWidth: 1,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={{ marginLeft: 8, fontWeight: '500', color: colors.textSecondary }} numberOfLines={1}>
                {est.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary, marginTop: 8 }}>
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
                pinColor={colors.primary}
              />
            )}
          </MapView>
        )}

        {/* Floating actions on map */}
        <View style={{ position: "absolute", right: 20, top: 20 }}>
          <TouchableOpacity
            onPress={recenter}
            style={{ width: 48, height: 48, backgroundColor: colors.surface, borderRadius: 999, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, marginBottom: 12 }}
          >
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Indicateur de chargement */}
        {isLoading && (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: colors.surface + '99', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
      {/* Liste des établissements (always visible below map) */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          paddingTop: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -100,
          elevation: 15,
          shadowColor: "#000",
          borderWidth: 1,
          borderColor: colors.border,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary }}>Établissements</Text>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Trier</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 14, color: colors.textTertiary }}>
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
            <View style={{ height: 1, backgroundColor: colors.border, width: '100%' }} />
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
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginTop: 16, textAlign: 'center' }}>
                Aucun établissement
              </Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
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
