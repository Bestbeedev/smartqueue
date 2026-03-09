import 'dart:math' as math;

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

  static double _degToRad(double deg) => deg * (math.pi / 180.0);
}
