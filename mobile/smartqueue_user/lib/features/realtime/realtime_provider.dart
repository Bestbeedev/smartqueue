import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/models/ticket.dart';
import 'package:smartqueue_user/data/repositories/tickets_repository.dart';
import 'package:smartqueue_user/services/websocket_service.dart';
import 'package:smartqueue_user/features/auth/auth_repository.dart';

/// Fournit l'état courant d'un ticket (fetch simple; temps réel à améliorer via WebSocket)
final ticketRealtimeProvider = FutureProvider.family<Ticket, int>((ref, ticketId) async {
  final api = await ApiClient.create();
  final repo = TicketsRepository(api);
  return repo.byId(ticketId);
});

class UserRealtimeNotifier extends Notifier<Map<String, dynamic>?> {
  WebSocketService? _ws;
  StreamSubscription? _sub;

  @override
  Map<String, dynamic>? build() {
    ref.onDispose(() {
      _sub?.cancel();
      _ws?.dispose();
    });
    return null;
  }

  Future<void> connect() async {
    final repo = await AuthRepository.create();
    final (_, user) = await repo.current();
    if (user == null) throw Exception('Utilisateur non connecté');

    _ws ??= WebSocketService();
    await _ws!.connectPrivateUserChannel(userId: user.id);

    await _sub?.cancel();
    _sub = _ws!.stream.listen((event) {
      state = event;
    });
  }

  Future<void> disconnect() async {
    await _sub?.cancel();
    _sub = null;
    await _ws?.dispose();
    _ws = null;
    state = null;
  }
}

final userRealtimeProvider = NotifierProvider.autoDispose<UserRealtimeNotifier, Map<String, dynamic>?>(
  UserRealtimeNotifier.new,
);
