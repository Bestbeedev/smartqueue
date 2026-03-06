import '../api_client.dart';
import '../models/notification_preferences.dart';
import '../../core/config.dart';

class NotificationPreferencesRepository {
  final ApiClient _client;
  NotificationPreferencesRepository(this._client);

  Future<NotificationPreferences> getPrefs() async {
    final res = await _client.dio.get(AppConfig.notificationPreferences);
    final data = res.data is Map ? (res.data as Map).cast<String, dynamic>() : <String, dynamic>{};
    return NotificationPreferences.fromJson(data);
  }

  Future<NotificationPreferences> update(NotificationPreferences prefs) async {
    final res = await _client.dio.put(
      AppConfig.notificationPreferences,
      data: prefs.toUpdateJson(),
    );
    final data = res.data is Map ? (res.data as Map).cast<String, dynamic>() : <String, dynamic>{};
    return NotificationPreferences.fromJson(data);
  }
}
