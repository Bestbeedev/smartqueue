import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:smartqueue_user/core/app_theme.dart';
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
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Scanner
          MobileScanner(key: keyQR, controller: controller),
          
          // Overlay gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.7),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withOpacity(0.7),
                ],
                stops: const [0.0, 0.2, 0.8, 1.0],
              ),
            ),
          ),
          
          // Header
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => Navigator.pop(context),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(
                        CupertinoIcons.back,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Scan QR Code',
                    style: AppTheme.headline.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(width: 36),
                ],
              ),
            ),
          ),
          
          // Scan frame
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: AppTheme.primaryColor.withOpacity(0.8),
                  width: 2,
                ),
              ),
              child: Stack(
                children: [
                  // Corner markers
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primaryColor, width: 4),
                          left: BorderSide(color: AppTheme.primaryColor, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(20),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primaryColor, width: 4),
                          right: BorderSide(color: AppTheme.primaryColor, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          topRight: Radius.circular(20),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppTheme.primaryColor, width: 4),
                          left: BorderSide(color: AppTheme.primaryColor, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(20),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppTheme.primaryColor, width: 4),
                          right: BorderSide(color: AppTheme.primaryColor, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          bottomRight: Radius.circular(20),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Instructions
          Positioned(
            bottom: 120,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Scan the QR code at the establishment\nto join the queue instantly',
                    textAlign: TextAlign.center,
                    style: AppTheme.callout.copyWith(
                      color: Colors.white.withOpacity(0.9),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Manual entry option
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: CupertinoButton(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                onPressed: () {
                  // TODO: Implement manual entry
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Manual entry coming soon')),
                  );
                },
                child: Text(
                  'Manual Entry',
                  style: AppTheme.body.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
