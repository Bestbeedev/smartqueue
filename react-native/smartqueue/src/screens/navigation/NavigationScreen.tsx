import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useTicket } from "../../store/ticketStore";
import { useDistanceTracking } from "../../hooks/useDistanceTracking";
import { useCustomAlert } from "../../hooks/useCustomAlert";
import { useAlertPreferencesStore } from "../../store/alertPreferencesStore";
import {
  formatDistance,
  formatTravelTime,
  Coordinates,
} from "../../utils/distance";
import "../../../global.css";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TransportMode = "walking" | "motorcycle" | "car";

export const NavigationScreen: React.FC = () => {
  const colors = useThemeColors();
  const { AlertComponent, showError } = useCustomAlert();
  const mapRef = useRef<MapView>(null);

  const { activeTicket, hasActiveTicket } = useTicket();
  const { preferredTransportMode, setPreferredTransportMode } =
    useAlertPreferencesStore();

  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [selectedMode, setSelectedMode] = useState<TransportMode>(
    (preferredTransportMode as TransportMode) || "car"
  );

  // Get establishment coordinates from active ticket
  const establishmentCoords = React.useMemo(() => {
    if (!activeTicket?.establishment) return null;
    const est = activeTicket.establishment as any;
    if (est?.lat == null || est?.lng == null) return null;
    return {
      latitude: Number(est.lat),
      longitude: Number(est.lng),
    };
  }, [activeTicket]);

  // Distance tracking hook
  const {
    distanceInfo,
    userLocation,
    isLoading: isLoadingDistance,
    error: distanceError,
    refreshDistance,
  } = useDistanceTracking({
    targetCoordinates: establishmentCoords
      ? {
          latitude: establishmentCoords.latitude,
          longitude: establishmentCoords.longitude,
        }
      : null,
    enabled: hasActiveTicket && !!establishmentCoords,
    autoRefreshInterval: 10000, // 10 seconds for more real-time feel
  });

  // Generate route coordinates (straight line + intermediate points for curve effect)
  useEffect(() => {
    if (!userLocation || !establishmentCoords) return;

    const generateRoute = () => {
      const start: Coordinates = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      const end: Coordinates = {
        latitude: establishmentCoords.latitude,
        longitude: establishmentCoords.longitude,
      };

      // Create intermediate points for a slightly curved route appearance
      const numPoints = 20;
      const points: Coordinates[] = [start];

      for (let i = 1; i < numPoints; i++) {
        const t = i / numPoints;
        // Linear interpolation with slight curve offset
        const lat = start.latitude + (end.latitude - start.latitude) * t;
        const lng = start.longitude + (end.longitude - start.longitude) * t;
        points.push({ latitude: lat, longitude: lng });
      }

      points.push(end);
      setRouteCoordinates(points);
    };

    generateRoute();
  }, [userLocation, establishmentCoords]);

  // Fit map to show both user and destination
  useEffect(() => {
    if (!mapRef.current || !userLocation || !establishmentCoords) return;

    const padding = 60;
    mapRef.current.fitToCoordinates(
      [
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        {
          latitude: establishmentCoords.latitude,
          longitude: establishmentCoords.longitude,
        },
      ],
      {
        edgePadding: {
          top: padding + 100,
          right: padding,
          bottom: padding + 200,
          left: padding,
        },
        animated: true,
      }
    );
  }, [userLocation, establishmentCoords, routeCoordinates]);

  // Handle transport mode change
  const handleModeChange = useCallback(
    (mode: TransportMode) => {
      setSelectedMode(mode);
      setPreferredTransportMode(mode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setPreferredTransportMode]
  );

  // Recenter map on user
  const handleRecenter = useCallback(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  }, [userLocation]);

  // Show error if no active ticket or coordinates
  useEffect(() => {
    if (!hasActiveTicket) {
      showError(
        "Aucun ticket actif",
        "Vous devez avoir un ticket réservé pour utiliser la navigation."
      );
      router.back();
    } else if (!establishmentCoords) {
      showError(
        "Coordonnées indisponibles",
        "L'établissement n'a pas renseigné sa position GPS."
      );
      router.back();
    }
  }, [hasActiveTicket, establishmentCoords]);

  // Get travel time for selected mode
  const travelTime = distanceInfo?.travelTimes[selectedMode] || 0;
  const distance = distanceInfo?.kilometers || 0;

  const transportModes: { mode: TransportMode; icon: any; label: string }[] = [
    { mode: "walking", icon: "walk", label: "À pied" },
    { mode: "motorcycle", icon: "bicycle", label: "Moto" },
    { mode: "car", icon: "car", label: "Voiture" },
  ];

  if (!hasActiveTicket || !establishmentCoords) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {AlertComponent}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {activeTicket?.establishment?.name || "Navigation"}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {activeTicket?.service?.name || "Service"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={refreshDistance}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {userLocation ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={true}
          >
            {/* User Location Marker */}
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Votre position"
            >
              <View
                style={[
                  styles.userMarker,
                  { backgroundColor: colors.primary, borderColor: colors.surface },
                ]}
              >
                <Ionicons name="person" size={14} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Destination Marker */}
            <Marker
              coordinate={{
                latitude: establishmentCoords.latitude,
                longitude: establishmentCoords.longitude,
              }}
              title={activeTicket?.establishment?.name || "Destination"}
              description={activeTicket?.service?.name || ""}
            >
              <View
                style={[
                  styles.destinationMarker,
                  { backgroundColor: colors.danger },
                ]}
              >
                <Ionicons name="business" size={18} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Route Line */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.primary}
                strokeWidth={4}
                lineDashPattern={[0]} // Solid line
              />
            )}
          </MapView>
        ) : (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Localisation en cours...
            </Text>
          </View>
        )}

        {/* Recenter Button */}
        <TouchableOpacity
          onPress={handleRecenter}
          style={[
            styles.recenterButton,
            { backgroundColor: colors.surface },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.surface }]}>
        {/* Transport Mode Selector */}
        <View style={styles.modeSelector}>
          {transportModes.map(({ mode, icon, label }) => (
            <TouchableOpacity
              key={mode}
              onPress={() => handleModeChange(mode)}
              style={[
                styles.modeButton,
                {
                  backgroundColor:
                    selectedMode === mode
                      ? colors.primary + "20"
                      : colors.surfaceSecondary,
                  borderColor:
                    selectedMode === mode ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon}
                size={20}
                color={selectedMode === mode ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeLabel,
                  {
                    color:
                      selectedMode === mode
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Distance & Time Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="navigate" size={24} color={colors.primary} />
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {formatDistance(distance)}
            </Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Distance
            </Text>
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoItem}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {formatTravelTime(travelTime)}
            </Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Temps estimé
            </Text>
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoItem}>
            <Ionicons name="ticket" size={24} color={colors.primary} />
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              N°{activeTicket?.number?.split("-").pop() || "--"}
            </Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Votre ticket
            </Text>
          </View>
        </View>

        {/* Arrival Time */}
        {distanceInfo && (
          <View
            style={[
              styles.arrivalBox,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <Ionicons name="flag" size={20} color={colors.success} />
            <Text style={[styles.arrivalText, { color: colors.success }]}>
              Arrivée estimée à{" "}
              {new Date(Date.now() + travelTime * 60000).toLocaleTimeString(
                "fr-FR",
                { hour: "2-digit", minute: "2-digit" }
              )}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Could integrate with external maps app here
              // Linking.openURL(`https://maps.google.com/?daddr=${establishmentCoords.latitude},${establishmentCoords.longitude}`);
              router.push("/(tabs)/live-ticket" as any);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Voir mon ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      {AlertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  recenterButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 40,
  },
  arrivalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  arrivalText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NavigationScreen;
