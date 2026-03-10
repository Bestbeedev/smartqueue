import 'dart:math' as math;

enum TravelModeHeuristic {
  walk,
  moto,
  car,
}

class EtaHeuristicResult {
  final int minutes;
  final TravelModeHeuristic mode;

  const EtaHeuristicResult({required this.minutes, required this.mode});
}

class GeoUtils {
  static const double _earthRadiusM = 6371000.0;

  static double distanceMeters({
    required double lat1,
    required double lng1,
    required double lat2,
    required double lng2,
  }) {
    final dLat = _degToRad(lat2 - lat1);
    final dLng = _degToRad(lng2 - lng1);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_degToRad(lat1)) *
            math.cos(_degToRad(lat2)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return _earthRadiusM * c;
  }

  /// ETA heuristique (minutes) basé sur une vitesse moyenne.
  ///
  /// Par défaut:
  /// - vitesse “ville” ~ 25 km/h
  /// - vitesse “à pied” ~ 4 km/h (utilisée si distance courte)
  static int etaMinutesHeuristic(double distanceMeters,
      {double speedKmhCity = 25.0, double speedKmhWalk = 4.0}) {
    if (distanceMeters.isNaN || distanceMeters.isInfinite) return 0;
    final useWalk = distanceMeters < 1200; // < ~1.2 km
    final speedMps = (useWalk ? speedKmhWalk : speedKmhCity) * 1000 / 3600;
    final seconds = distanceMeters / speedMps;
    final minutes = (seconds / 60).round();
    return minutes < 1 ? 1 : minutes;
  }

  static EtaHeuristicResult etaHeuristic(double distanceMeters,
      {double speedKmhCity = 25.0, double speedKmhWalk = 4.0}) {
    if (distanceMeters.isNaN || distanceMeters.isInfinite) {
      return const EtaHeuristicResult(minutes: 0, mode: TravelModeHeuristic.car);
    }
    final useWalk = distanceMeters < 1200; // < ~1.2 km
    final mode = useWalk ? TravelModeHeuristic.walk : TravelModeHeuristic.car;
    final speedMps = (useWalk ? speedKmhWalk : speedKmhCity) * 1000 / 3600;
    final seconds = distanceMeters / speedMps;
    final minutes = (seconds / 60).round();
    return EtaHeuristicResult(minutes: minutes < 1 ? 1 : minutes, mode: mode);
  }

  static int etaMinutesForMode(double distanceMeters, TravelModeHeuristic mode,
      {double speedKmhWalk = 4.0, double speedKmhMoto = 35.0, double speedKmhCar = 25.0}) {
    if (distanceMeters.isNaN || distanceMeters.isInfinite) return 0;
    final speedKmh = switch (mode) {
      TravelModeHeuristic.walk => speedKmhWalk,
      TravelModeHeuristic.moto => speedKmhMoto,
      TravelModeHeuristic.car => speedKmhCar,
    };
    final speedMps = speedKmh * 1000 / 3600;
    final seconds = distanceMeters / speedMps;
    final minutes = (seconds / 60).round();
    return minutes < 1 ? 1 : minutes;
  }

  static Map<TravelModeHeuristic, int> etaMinutesAllModes(double distanceMeters,
      {double speedKmhWalk = 4.0, double speedKmhMoto = 35.0, double speedKmhCar = 25.0}) {
    return {
      TravelModeHeuristic.walk: etaMinutesForMode(distanceMeters, TravelModeHeuristic.walk,
          speedKmhWalk: speedKmhWalk, speedKmhMoto: speedKmhMoto, speedKmhCar: speedKmhCar),
      TravelModeHeuristic.moto: etaMinutesForMode(distanceMeters, TravelModeHeuristic.moto,
          speedKmhWalk: speedKmhWalk, speedKmhMoto: speedKmhMoto, speedKmhCar: speedKmhCar),
      TravelModeHeuristic.car: etaMinutesForMode(distanceMeters, TravelModeHeuristic.car,
          speedKmhWalk: speedKmhWalk, speedKmhMoto: speedKmhMoto, speedKmhCar: speedKmhCar),
    };
  }

  static double _degToRad(double deg) => deg * (math.pi / 180.0);
}
