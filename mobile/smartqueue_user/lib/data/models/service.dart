class ServiceModel {
  final int id;
  final String name;
  final String status; // open | closed
  final int avgServiceTimeMinutes;
  final int establishmentId;
  final int? peopleWaiting; // depuis API backend
  final int? agentsCount; // depuis API backend

  ServiceModel({
    required this.id,
    required this.name,
    required this.status,
    required this.avgServiceTimeMinutes,
    required this.establishmentId,
    this.peopleWaiting,
    this.agentsCount,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> j) => ServiceModel(
        id: _toInt(j['id']),
        name: (j['name'] as String?) ?? (j['title'] as String?) ?? 'Service',
        status: (j['status'] as String?) ?? 'open',
        avgServiceTimeMinutes:
            _toInt(j['avg_service_time_minutes'] ?? j['avgTime'] ?? 10),
        establishmentId: _toInt(j['establishment_id'] ?? j['establishmentId']),
        peopleWaiting: _toIntOrNull(j['people_waiting']),
        agentsCount: _toIntOrNull(j['agents_count']),
      );

  static int _toInt(Object? v) => int.tryParse(v?.toString() ?? '') ?? 0;
  static int? _toIntOrNull(Object? v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }
}
