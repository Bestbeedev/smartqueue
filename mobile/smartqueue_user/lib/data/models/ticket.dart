class Ticket {
  final int id;
  final String number; // backend renvoie 'number' pas 'ticketNumber'
  final String status; // created | waiting | called | closed | absent | expired
  final int? priority;
  final int? position;
  final int? etaMinutes;
  final DateTime? calledAt;
  final Service? service; // service imbriqué
  final Establishment? establishment; // establishment imbriqué via service
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Ticket({
    required this.id,
    required this.number,
    required this.status,
    this.priority,
    this.position,
    this.etaMinutes,
    this.calledAt,
    this.service,
    this.establishment,
    this.createdAt,
    this.updatedAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> j) {
    final serviceData = j['service'];
    final establishmentData = serviceData?['establishment'];

    return Ticket(
      id: _toInt(j['id']),
      number: j['number']?.toString() ??
          j['ticket_number']?.toString() ??
          j['ticketNumber']?.toString() ??
          '',
      status: (j['status'] as String?) ?? 'waiting',
      priority: _toIntOrNull(j['priority']),
      position: _toIntOrNull(j['position']),
      etaMinutes: _toIntOrNull(j['eta_minutes']),
      calledAt: _parseDate(j['called_at']),
      service: serviceData != null ? Service.fromJson(serviceData) : null,
      establishment: establishmentData != null
          ? Establishment.fromJson(establishmentData)
          : null,
      createdAt: _parseDate(j['created_at']),
      updatedAt: _parseDate(j['updated_at']),
    );
  }

  // Helper getters pour compatibilité avec code existant
  String get ticketNumber => number;
  String? get serviceName => service?.name;
  int? get serviceId => service?.id;
  DateTime? get updatedAtCompat => updatedAt;

  static int _toInt(Object? v) => int.tryParse(v?.toString() ?? '') ?? -1;
  static int? _toIntOrNull(Object? v) =>
      v == null ? null : int.tryParse(v.toString());
  static DateTime? _parseDate(Object? v) {
    if (v == null) return null;
    if (v is String) return DateTime.tryParse(v);
    return null;
  }
}

class Service {
  final int id;
  final String name;
  final String status; // open | closed
  final int? avgServiceTimeMinutes;
  final int establishmentId;

  Service({
    required this.id,
    required this.name,
    required this.status,
    this.avgServiceTimeMinutes,
    required this.establishmentId,
  });

  factory Service.fromJson(Map<String, dynamic> j) => Service(
        id: _toInt(j['id']),
        name: j['name']?.toString() ?? '',
        status: j['status']?.toString() ?? 'closed',
        avgServiceTimeMinutes: _toIntOrNull(j['avg_service_time_minutes']),
        establishmentId: _toInt(j['establishment_id']),
      );

  static int _toInt(Object? v) => int.tryParse(v?.toString() ?? '') ?? -1;
  static int? _toIntOrNull(Object? v) =>
      v == null ? null : int.tryParse(v.toString());
}

class Establishment {
  final int id;
  final String name;

  Establishment({
    required this.id,
    required this.name,
  });

  factory Establishment.fromJson(Map<String, dynamic> j) => Establishment(
        id: _toInt(j['id']),
        name: j['name']?.toString() ?? '',
      );

  static int _toInt(Object? v) => int.tryParse(v?.toString() ?? '') ?? -1;
}
