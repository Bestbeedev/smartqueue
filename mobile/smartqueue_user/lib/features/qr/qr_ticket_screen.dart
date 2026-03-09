import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../websocket/websocket_service.dart';

/// QR Code Ticket Screen - Display QR code for ticket validation
class QRTicketScreen extends ConsumerStatefulWidget {
  final String ticketNumber;
  final String serviceName;
  final String establishmentName;

  const QRTicketScreen({
    super.key,
    required this.ticketNumber,
    required this.serviceName,
    required this.establishmentName,
  });

  @override
  ConsumerState<QRTicketScreen> createState() => _QRTicketScreenState();
}

class _QRTicketScreenState extends ConsumerState<QRTicketScreen> {
  final WebSocketService _wsService = WebSocketService.instance;
  bool _isConnected = false;
  TicketUpdate? _lastUpdate;

  @override
  void initState() {
    super.initState();
    _wsService.ticketUpdates.listen(_handleTicketUpdate);
    _wsService.connect(widget.ticketNumber);
  }

  @override
  void dispose() {
    _wsService.disconnect();
    super.dispose();
  }

  void _handleTicketUpdate(TicketUpdate update) {
    setState(() {
      _lastUpdate = update;
      _isConnected = true;
    });

    if (update.type == 'status_update' && update.status == 'called') {
      _showNotification(
          'Ticket Appelé !', update.message ?? 'Votre ticket est appelé !');
    }
  }

  void _showNotification(String title, String message) {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _copyToClipboard() {
    final qrData = _generateQRData();
    Clipboard.setData(ClipboardData(text: qrData));
    HapticFeedback.lightImpact();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR Code data copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  String _generateQRData() {
    return 'VQS|${widget.ticketNumber}|${widget.serviceName}|${widget.establishmentName}|${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Header
              Row(
                children: [
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => Navigator.pop(context),
                    child: const Icon(
                      CupertinoIcons.back,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'QR TICKET',
                    style: AppTheme.title3.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const Spacer(),
                  // Connection status
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _isConnected
                          ? AppTheme.successColor
                          : AppTheme.textSecondary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      CupertinoIcons.wifi,
                      size: 16,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),

              const Spacer(),

              // QR Code Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Header info
                    Column(
                      children: [
                        Text(
                          widget.establishmentName,
                          style: AppTheme.headline.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.serviceName,
                          style: AppTheme.callout.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // QR Code Placeholder (since qr_flutter is not available)
                    Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AppTheme.primaryColor.withOpacity(0.2),
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            CupertinoIcons.qrcode,
                            size: 80,
                            color: AppTheme.primaryColor,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.ticketNumber,
                            style: AppTheme.headline.copyWith(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Ticket number
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Ticket #${widget.ticketNumber}',
                        style: AppTheme.title3.copyWith(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Real-time status
                    if (_isConnected)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.successColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.successColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'LIVE UPDATES',
                              style: AppTheme.caption1.copyWith(
                                color: AppTheme.successColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Status information
              if (_lastUpdate != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppTheme.dividerColor.withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Live Status',
                        style: AppTheme.callout.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          if (_lastUpdate!.position != null)
                            Column(
                              children: [
                                Text(
                                  'Position',
                                  style: AppTheme.caption1.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _lastUpdate!.position.toString(),
                                  style: AppTheme.headline.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ],
                            ),
                          if (_lastUpdate!.etaMinutes != null)
                            Column(
                              children: [
                                Text(
                                  'ETA',
                                  style: AppTheme.caption1.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${_lastUpdate!.etaMinutes}m',
                                  style: AppTheme.headline.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ],
                            ),
                          if (_lastUpdate!.peopleAhead != null)
                            Column(
                              children: [
                                Text(
                                  'Ahead',
                                  style: AppTheme.caption1.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _lastUpdate!.peopleAhead.toString(),
                                  style: AppTheme.headline.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.warningColor,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

              const Spacer(),

              // Action buttons
              Column(
                children: [
                  // Copy QR data button
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButtonCustom(
                      onPressed: _copyToClipboard,
                      filled: true,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            CupertinoIcons.doc_on_clipboard,
                            color: Colors.white,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Copy QR Data',
                            style: AppTheme.button.copyWith(
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Share button
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButtonCustom(
                      onPressed: () {
                        // TODO: Implement share functionality
                        _showNotification(
                            'Share', 'Share functionality coming soon!');
                      },
                      filled: false,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            CupertinoIcons.share,
                            color: AppTheme.primaryColor,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Share Ticket',
                            style: AppTheme.button.copyWith(
                              color: AppTheme.primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
