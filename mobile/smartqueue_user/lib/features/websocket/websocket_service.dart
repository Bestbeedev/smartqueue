import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../data/models/ticket.dart';

/// WebSocket service for real-time ticket updates
class WebSocketService {
  static WebSocketService? _instance;
  static WebSocketService get instance => _instance ??= WebSocketService._();

  WebSocketService._();

  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  final StreamController<TicketUpdate> _updateController =
      StreamController<TicketUpdate>.broadcast();

  Stream<TicketUpdate> get ticketUpdates => _updateController.stream;

  bool get isConnected => _channel != null;

  Future<void> connect(String ticketId) async {
    if (_channel != null) {
      await disconnect();
    }

    try {
      // Connect to WebSocket server
      final uri = Uri.parse('ws://localhost:8080/ws/ticket/$ticketId');
      _channel = WebSocketChannel.connect(uri);

      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
        cancelOnError: false,
      );

      if (kDebugMode) {
        print('WebSocket connected for ticket: $ticketId');
      }
    } catch (e) {
      if (kDebugMode) {
        print('WebSocket connection error: $e');
      }
      // Simulate connection for demo purposes
      _simulateRealTimeUpdates(ticketId);
    }
  }

  Future<void> disconnect() async {
    _subscription?.cancel();
    _subscription = null;

    await _channel?.sink.close();
    _channel = null;

    if (kDebugMode) {
      print('WebSocket disconnected');
    }
  }

  void _handleMessage(dynamic message) {
    try {
      final data = json.decode(message);
      final update = TicketUpdate.fromJson(data);
      _updateController.add(update);

      if (kDebugMode) {
        print('Received WebSocket update: ${update.type}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error parsing WebSocket message: $e');
      }
    }
  }

  void _handleError(dynamic error) {
    if (kDebugMode) {
      print('WebSocket error: $error');
    }
  }

  void _handleDone() {
    if (kDebugMode) {
      print('WebSocket connection closed');
    }
    _channel = null;
    _subscription = null;
  }

  void _simulateRealTimeUpdates(String ticketId) {
    // Simulate real-time updates for demo purposes
    Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_channel == null) {
        timer.cancel();
        return;
      }

      final random = DateTime.now().millisecond % 100;
      TicketUpdate update;

      if (random < 30) {
        // Position update
        update = TicketUpdate(
          type: 'position_update',
          ticketId: ticketId,
          position: (random % 5) + 1,
          etaMinutes: (random % 15) + 5,
        );
      } else if (random < 60) {
        // ETA update
        update = TicketUpdate(
          type: 'eta_update',
          ticketId: ticketId,
          etaMinutes: (random % 10) + 3,
        );
      } else if (random < 80) {
        // Status update
        update = TicketUpdate(
          type: 'status_update',
          ticketId: ticketId,
          status: 'called',
          message: 'Votre ticket est appelé !',
        );
      } else {
        // Queue info
        update = TicketUpdate(
          type: 'queue_info',
          ticketId: ticketId,
          peopleAhead: (random % 8) + 1,
          avgWaitTime: (random % 20) + 10,
        );
      }

      _updateController.add(update);
    });
  }

  void dispose() {
    disconnect();
    _updateController.close();
  }
}

class TicketUpdate {
  final String type;
  final String ticketId;
  final int? position;
  final int? etaMinutes;
  final String? status;
  final String? message;
  final int? peopleAhead;
  final int? avgWaitTime;
  final DateTime? timestamp;

  TicketUpdate({
    required this.type,
    required this.ticketId,
    this.position,
    this.etaMinutes,
    this.status,
    this.message,
    this.peopleAhead,
    this.avgWaitTime,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory TicketUpdate.fromJson(Map<String, dynamic> json) {
    return TicketUpdate(
      type: json['type'] ?? '',
      ticketId: json['ticketId'] ?? '',
      position: json['position'],
      etaMinutes: json['etaMinutes'],
      status: json['status'],
      message: json['message'],
      peopleAhead: json['peopleAhead'],
      avgWaitTime: json['avgWaitTime'],
      timestamp:
          json['timestamp'] != null ? DateTime.parse(json['timestamp']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'ticketId': ticketId,
      'position': position,
      'etaMinutes': etaMinutes,
      'status': status,
      'message': message,
      'peopleAhead': peopleAhead,
      'avgWaitTime': avgWaitTime,
      'timestamp': timestamp?.toIso8601String(),
    };
  }
}
