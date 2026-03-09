import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/repositories/tickets_repository.dart';

/// Scanner QR pour lier un ticket / rejoindre une file
class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final keyQR = GlobalKey(debugLabel: 'QR');
  MobileScannerController? controller;
  bool _handled = false;

  Map<String, String>? _parseVqs(String code) {
    if (!code.startsWith('VQS|')) return null;
    final parts = code.split('|');
    if (parts.length < 3) return null;
    return {
      'format': 'vqs',
      'ticket_number': parts[1],
      'service_name': parts.length > 2 ? parts[2] : '',
      'establishment_name': parts.length > 3 ? parts[3] : '',
      if (parts.length > 4) 'ts': parts[4],
    };
  }

  Future<void> _resumeScanningWithError(String message) async {
    _handled = false;
    await controller?.start();
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void initState() {
    super.initState();
    final c = MobileScannerController();
    _onQRViewCreated(c);
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  void _onQRViewCreated(MobileScannerController c) {
    controller = c;
    c.barcodes.listen((capture) async {
      final code = capture.barcodes.isNotEmpty ? (capture.barcodes.first.rawValue ?? '') : '';
      if (!mounted || _handled) return;
      if (code.isEmpty) return;

      final vqs = _parseVqs(code);
      if (vqs != null) {
        _handled = true;
        await controller?.stop();
        await _resumeScanningWithError('QR non supporté (format legacy VQS).');
        return;
      }

      Uri? uri;
      try {
        uri = Uri.tryParse(code);
      } catch (_) {}

      if (uri != null && uri.scheme == 'smartqueue') {
        _handled = true;
        await controller?.stop();
        final host = uri.host; // e.g. ticket or service
        if (host == 'ticket') {
          final idStr = uri.queryParameters['id'];
          final ticketId = int.tryParse(idStr ?? '');
          final serviceName = uri.queryParameters['name'] ?? 'Service';
          if (ticketId != null) {
            if (!mounted) return;
            AppRouter.navigatorKey.currentState?.pushNamed(AppRouter.ticketDetail, arguments: {
              'ticketId': ticketId,
              'serviceName': serviceName,
            });
            return;
          }
        } else if (host == 'service') {
          final idStr = uri.queryParameters['id'];
          final serviceId = int.tryParse(idStr ?? '');
          final serviceName = uri.queryParameters['name'] ?? 'Service';
          final token = uri.queryParameters['token'] ?? uri.queryParameters['t'];
          if (serviceId != null) {
            try {
              final api = await ApiClient.create();
              final repo = TicketsRepository(api);
              // token est optionnel côté backend: si non supporté, il sera ignoré.
              final ticket = await repo.create(serviceId, fromQr: true);

              if (!mounted) return;
              AppRouter.navigatorKey.currentState?.pushNamed(AppRouter.ticketDetail, arguments: {
                'ticketId': ticket.id,
                'serviceName': serviceName,
                'ticket': ticket,
                if (token != null) 'token': token,
              });
            } catch (e) {
              await _resumeScanningWithError(
                e is Exception
                  ? e.toString().replaceAll('Exception: ', '')
                  : 'Impossible de créer le ticket via QR (connexion requise).',
              );
            }
            return;
          }
        }
        // Format inconnu -> reprendre le flux et notifier
        await _resumeScanningWithError('QR non reconnu: $code');
        return;
      }

      // Affichage par défaut si URL non smartqueue
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('QR: $code')));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner un QR Code')),
      body: MobileScanner(key: keyQR, controller: controller),
    );
  }
}
