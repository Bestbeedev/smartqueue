class NotificationPreferences {
  final bool pushEnabled;
  final bool smsEnabled;
  final int notifyBeforePositions;
  final int notifyBeforeMinutes;

  const NotificationPreferences({
    required this.pushEnabled,
    required this.smsEnabled,
    required this.notifyBeforePositions,
    required this.notifyBeforeMinutes,
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> j) {
    final data = (j['data'] is Map ? (j['data'] as Map).cast<String, dynamic>() : j);
    return NotificationPreferences(
      pushEnabled: (data['push_enabled'] as bool?) ?? true,
      smsEnabled: (data['sms_enabled'] as bool?) ?? false,
      notifyBeforePositions: _toInt(data['notify_before_positions']) ?? 3,
      notifyBeforeMinutes: _toInt(data['notify_before_minutes']) ?? 10,
    );
  }

  Map<String, dynamic> toUpdateJson() => {
        'push_enabled': pushEnabled,
        'sms_enabled': smsEnabled,
        'notify_before_positions': notifyBeforePositions,
        'notify_before_minutes': notifyBeforeMinutes,
      };

  NotificationPreferences copyWith({
    bool? pushEnabled,
    bool? smsEnabled,
    int? notifyBeforePositions,
    int? notifyBeforeMinutes,
  }) =>
      NotificationPreferences(
        pushEnabled: pushEnabled ?? this.pushEnabled,
        smsEnabled: smsEnabled ?? this.smsEnabled,
        notifyBeforePositions: notifyBeforePositions ?? this.notifyBeforePositions,
        notifyBeforeMinutes: notifyBeforeMinutes ?? this.notifyBeforeMinutes,
      );

  static int? _toInt(Object? v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }
}
