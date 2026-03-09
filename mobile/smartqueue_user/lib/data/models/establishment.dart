// Modèle d'établissement (utilisateur)
class Establishment {
  final int id;
  final String name;
  final double latitude;
  final double longitude;
  final String? address;
  final String affluence; // low | medium | high
  final int? peopleWaiting;
  final double? distance;

  Establishment({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.address,
    required this.affluence,
    this.peopleWaiting,
    this.distance,
  });

  factory Establishment.fromJson(Map<String, dynamic> j) => Establishment(
        id: j['id'] is int ? j['id'] as int : int.tryParse('${j['id']}') ?? -1,
        name: (j['name'] as String?) ?? (j['title'] as String?) ?? 'Établissement',
        latitude: _toDouble(j['latitude'] ?? j['lat']),
        longitude: _toDouble(j['longitude'] ?? j['lng']),
        address: (j['address'] as String?) ?? (j['location'] as String?),
        affluence: (j['crowd_level'] as String?) ?? (j['affluence'] as String?) ?? 'medium',
        peopleWaiting: _toIntOrNull(j['people_waiting'] ?? j['peopleWaiting']),
        distance: _toDoubleOrNull(j['distance'] ?? j['distance_km'] ?? j['distanceKm']),
      );

  static double _toDouble(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0.0;
  }

  static double? _toDoubleOrNull(Object? v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  static int? _toIntOrNull(Object? v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }
}
