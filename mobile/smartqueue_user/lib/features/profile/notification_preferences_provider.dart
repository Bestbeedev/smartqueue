import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/models/notification_preferences.dart';
import 'package:smartqueue_user/data/repositories/notification_preferences_repository.dart';

final notificationPreferencesProvider = AsyncNotifierProvider.autoDispose<NotificationPreferencesNotifier, NotificationPreferences>(
  NotificationPreferencesNotifier.new,
);

class NotificationPreferencesNotifier extends AsyncNotifier<NotificationPreferences> {
  @override
  Future<NotificationPreferences> build() async {
    final api = await ApiClient.create();
    final repo = NotificationPreferencesRepository(api);
    return repo.getPrefs();
  }

  Future<void> setPushEnabled(bool v) async {
    final current = state.asData?.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(pushEnabled: v));
    await _persist();
  }

  Future<void> setSmsEnabled(bool v) async {
    final current = state.asData?.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(smsEnabled: v));
    await _persist();
  }

  Future<void> setNotifyBeforePositions(int v) async {
    final current = state.asData?.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(notifyBeforePositions: v));
    await _persist();
  }

  Future<void> setNotifyBeforeMinutes(int v) async {
    final current = state.asData?.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(notifyBeforeMinutes: v));
    await _persist();
  }

  Future<void> _persist() async {
    final next = state.asData?.value;
    if (next == null) return;

    try {
      final api = await ApiClient.create();
      final repo = NotificationPreferencesRepository(api);
      final saved = await repo.update(next);
      state = AsyncData(saved);
    } catch (e, st) {
      // rollback to previous data could be added if needed
      state = AsyncError(e, st);
    }
  }
}
