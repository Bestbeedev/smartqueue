import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../websocket/websocket_service.dart';
import '../../core/app_router.dart';

/// Active Ticket Screen - The core interface with real-time updates
class ActiveTicketsScreen extends ConsumerStatefulWidget {
  const ActiveTicketsScreen({super.key});

  @override
  ConsumerState<ActiveTicketsScreen> createState() =>
      _ActiveTicketsScreenState();
}

class _ActiveTicketsScreenState extends ConsumerState<ActiveTicketsScreen> {
  final WebSocketService _wsService = WebSocketService.instance;
  TicketUpdate? _lastUpdate;
  bool _isConnected = false;

  @override
  void initState() {
    super.initState();
    _wsService.ticketUpdates.listen(_handleTicketUpdate);
    _wsService.connect('demo-ticket-123'); // Demo ticket ID
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

    // Show notification for important updates
    if (update.type == 'status_update' && update.status == 'called') {
      _showNotification(
          'Ticket Called!', update.message ?? 'Your ticket is being called!');
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

  @override
  Widget build(BuildContext context) {
    final position = _lastUpdate?.position ?? 3;
    final eta = _lastUpdate?.etaMinutes ?? 8;
    final peopleAhead = _lastUpdate?.peopleAhead ?? position - 1;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Header with connection status
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
                            'YOUR TICKET',
                            style: AppTheme.title3.copyWith(
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const Spacer(),
                          // Connection status indicator
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: _isConnected
                                  ? AppTheme.successColor
                                  : AppTheme.textSecondary,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              CupertinoIcons.wifi,
                              size: 16,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Main ticket display with real-time updates
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(40),
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryColor.withOpacity(0.3),
                              blurRadius: 30,
                              offset: const Offset(0, 15),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Real-time indicator
                            if (_isConnected)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'LIVE',
                                      style: AppTheme.caption1.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            const SizedBox(height: 20),

                            // Ticket number
                            Text(
                              'A123',
                              style: const TextStyle(
                                fontSize: 72,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 4,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Position in queue with real-time updates
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
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
                              'Position in queue',
                              style: AppTheme.callout.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  position.toString(),
                                  style: AppTheme.largeTitle.copyWith(
                                    fontSize: 48,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                if (_lastUpdate != null &&
                                    _lastUpdate!.type ==
                                        'position_update') ...[
                                  const SizedBox(width: 8),
                                  Icon(
                                    CupertinoIcons.arrow_up,
                                    color: AppTheme.successColor,
                                    size: 24,
                                  ),
                                ],
                              ],
                            ),
                            if (peopleAhead > 0)
                              Text(
                                '$peopleAhead people ahead',
                                style: AppTheme.caption1.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Estimated wait with real-time updates
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
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
                              'Estimated wait',
                              style: AppTheme.callout.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '$eta min',
                                  style: AppTheme.largeTitle.copyWith(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                                if (_lastUpdate != null &&
                                    _lastUpdate!.type == 'eta_update') ...[
                                  const SizedBox(width: 8),
                                  Icon(
                                    CupertinoIcons.time,
                                    color: AppTheme.primaryColor,
                                    size: 24,
                                  ),
                                ],
                              ],
                            ),
                            if (_lastUpdate?.avgWaitTime != null)
                              Text(
                                'Avg: ${_lastUpdate!.avgWaitTime} min',
                                style: AppTheme.caption1.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Progress bar with real-time updates
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Queue progress',
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            height: 8,
                            decoration: BoxDecoration(
                              color: AppTheme.backgroundColor,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor:
                                  position > 0 ? (1 - position / 10) : 1.0,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: AppTheme.primaryGradient,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                          ),
                          if (_lastUpdate != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Last update: ${_formatTime(_lastUpdate!.timestamp)}',
                                style: AppTheme.caption1.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ),
                        ],
                      ),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // Feature buttons
              Column(
                children: [
                  // QR Code button
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButtonCustom(
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          AppRouter.qrTicket,
                          arguments: {
                            'ticketNumber': 'A001',
                            'serviceName': 'Service Standard',
                            'establishmentName': 'Banque Principale',
                          },
                        );
                      },
                      filled: true,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            CupertinoIcons.qrcode,
                            color: Colors.white,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              'QR Code',
                              overflow: TextOverflow.ellipsis,
                              style: AppTheme.button.copyWith(
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Live Map button
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButtonCustom(
                      onPressed: () {
                        Navigator.pushNamed(context, AppRouter.liveMap);
                      },
                      filled: false,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            CupertinoIcons.location,
                            color: AppTheme.primaryColor,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              'Live Map',
                              overflow: TextOverflow.ellipsis,
                              style: AppTheme.button.copyWith(
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Predictive Waiting button
                  SizedBox(
                    width: double.infinity,
                    child: CupertinoButtonCustom(
                      onPressed: () {
                        Navigator.pushNamed(
                            context, AppRouter.predictiveWaiting);
                      },
                      filled: false,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            CupertinoIcons.chart_bar,
                            color: AppTheme.primaryColor,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              'AI Predictions',
                              overflow: TextOverflow.ellipsis,
                              style: AppTheme.button.copyWith(
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Cancel button
              SizedBox(
                width: double.infinity,
                child: CupertinoButtonCustom(
                  onPressed: () {
                    showCupertinoDialog(
                      context: context,
                      builder: (context) => CupertinoAlertDialog(
                        title: const Text('Cancel Ticket'),
                        content: const Text(
                            'Are you sure you want to cancel this ticket?'),
                        actions: [
                          CupertinoDialogAction(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('No'),
                          ),
                          CupertinoDialogAction(
                            onPressed: () {
                              Navigator.pop(context);
                              _wsService.disconnect();
                              Navigator.pop(context);
                            },
                            isDestructiveAction: true,
                            child: const Text('Yes'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: Text(
                    'Cancel Ticket',
                    style: AppTheme.button.copyWith(
                      color: AppTheme.errorColor,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime? time) {
    if (time == null) return '';
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inSeconds < 60) return "just now";
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}
