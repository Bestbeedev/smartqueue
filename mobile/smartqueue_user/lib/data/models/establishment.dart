// Modèle d'établissement (utilisateur) - aligné avec API backend
class Establishment {
  final int id;
  final String name;
  final String? address;
  final String? category;
  final double? lat; // backend renvoie 'lat'
  final double? lng; // backend renvoie 'lng'
  final String? openAt;
  final String? closeAt;
  final bool isActive;
  final int? distanceM; // distance en mètres depuis backend
  final String? crowdLevel; // low | medium | high depuis backend
  final int? peopleWaiting; // nombre de personnes en attente depuis backend

  Establishment({
    required this.id,
    required this.name,
    this.address,
    this.category,
    this.lat,
    this.lng,
    this.openAt,
    this.closeAt,
    required this.isActive,
    this.distanceM,
    this.crowdLevel,
    this.peopleWaiting,
  });

  factory Establishment.fromJson(Map<String, dynamic> j) => Establishment(
        id: _toInt(j['id']),
        name: j['name']?.toString() ?? '',
        address: j['address']?.toString(),
        category: j['category']?.toString(),
        lat: _toDoubleOrNull(j['lat']),
        lng: _toDoubleOrNull(j['lng']),
        openAt: j['open_at']?.toString(),
        closeAt: j['close_at']?.toString(),
        isActive: j['is_active'] is bool
            ? j['is_active']
            : (j['is_active']?.toString() == '1'),
        distanceM: _toIntOrNull(j['distance_m']),
        crowdLevel: j['crowd_level']?.toString(),
        peopleWaiting: _toIntOrNull(j['people_waiting']),
      );

  // Helper getters pour compatibilité avec code existant
  double get latitude => lat ?? 0.0;
  double get longitude => lng ?? 0.0;
  String get affluence => crowdLevel ?? 'medium';
  double? get distance =>
      distanceM != null ? (distanceM! / 1000.0) : null; // convertir en km

  static int _toInt(Object? v) => int.tryParse(v?.toString() ?? '') ?? -1;
  static int? _toIntOrNull(Object? v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }

  static double _toDouble(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0.0;
  }

  static double? _toDoubleOrNull(Object? v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
