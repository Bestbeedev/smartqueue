import 'dart:async';
import 'dart:convert';

import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config.dart';

class WebSocketService {
  PusherChannelsFlutter? _pusher;
  StreamController<Map<String, dynamic>>? _controller;
  String? _channelName;

  Stream<Map<String, dynamic>> get stream {
    _controller ??= StreamController<Map<String, dynamic>>.broadcast();
    return _controller!.stream;
  }

  Future<void> connectPrivateUserChannel({required int userId}) async {
    await disconnect();

    _controller ??= StreamController<Map<String, dynamic>>.broadcast();
    _channelName = 'private-user.$userId';

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null || token.isEmpty) {
      throw Exception('Token manquant: veuillez vous connecter.');
    }

    final ws = Uri.parse(AppConfig.wsUrl);
    final useTLS = ws.scheme == 'wss';

    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 8),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    _pusher = PusherChannelsFlutter.getInstance();
    await _pusher!.init(
      apiKey: 'local',
      cluster: 'mt1',
      useTLS: useTLS,
      onAuthorizer: (String channelName, String socketId, dynamic options) async {
        final res = await dio.post(
          AppConfig.broadcastingAuth,
          data: {
            'socket_id': socketId,
            'channel_name': channelName,
          },
        );
        final data = res.data;
        if (data is Map) {
          return data;
        }
        if (data is String) {
          return json.decode(data);
        }
        throw Exception('Réponse authorizer invalide');
      },
      onEvent: (PusherEvent event) {
        if (event.eventName == 'user.ticket.updated') {
          try {
            final payload = json.decode(event.data ?? '{}');
            if (payload is Map) {
              _controller?.add(payload.cast<String, dynamic>());
            }
          } catch (_) {}
        }
      },
      onSubscriptionSucceeded: (_, __) {},
      onSubscriptionError: (_, __) {},
      onConnectionStateChange: (currentState, previousState) {
        if (currentState == 'DISCONNECTED' || currentState == 'FAILED') {
          _controller?.add({'type': 'ws_state', 'state': currentState});
        }
      },
      onError: (message, code, error) {
        _controller?.add({'type': 'ws_error', 'message': message, 'code': code});
      },
    );

    await _pusher!.connect();
    await _pusher!.subscribe(channelName: _channelName!);
  }

  Future<void> disconnect() async {
    try {
      if (_pusher != null && _channelName != null) {
        await _pusher!.unsubscribe(channelName: _channelName!);
      }
    } catch (_) {}
    try {
      await _pusher?.disconnect();
    } catch (_) {}
    _pusher = null;
    _channelName = null;
  }

  Future<void> dispose() async {
    await disconnect();
    await _controller?.close();
    _controller = null;
  }
}
