// features/realtime/realtime_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/cupertino.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/features/realtime/realtime_provider.dart';
import 'package:smartqueue_user/data/models/ticket.dart';

class RealtimeScreen extends ConsumerStatefulWidget {
  final int ticketId;
  final String serviceName;
  final Ticket? initialTicket;

  const RealtimeScreen({
    super.key,
    required this.ticketId,
    required this.serviceName,
    this.initialTicket,
  });

  @override
  ConsumerState<RealtimeScreen> createState() => _RealtimeScreenState();
}

class _RealtimeScreenState extends ConsumerState<RealtimeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(userRealtimeProvider.notifier).connect());
  }

  @override
  void dispose() {
    ref.read(userRealtimeProvider.notifier).disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ref = this.ref;
    final rt = ref.watch(userRealtimeProvider);

    Ticket? initial = widget.initialTicket;

    if (initial != null) {
      // Merge realtime update payload if it targets the displayed ticket
      if (rt != null &&
          rt['ticket_id']?.toString() == widget.ticketId.toString()) {
        initial = Ticket(
          id: initial.id,
          number: initial.ticketNumber,
          status: (rt['status'] as String?) ?? initial.status,
          position: (rt['position'] is int)
              ? rt['position'] as int
              : int.tryParse(rt['position']?.toString() ?? ''),
          etaMinutes: (rt['eta_minutes'] is int)
              ? rt['eta_minutes'] as int
              : int.tryParse(rt['eta_minutes']?.toString() ?? ''),
          service: initial.service,
          establishment: initial.establishment,
          createdAt: initial.createdAt,
          updatedAt: DateTime.now(),
        );
      }

      final ticket = initial;
      return Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: AppBar(
          title: const Text('Suivi en temps réel'),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  // Header Card
                  Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const Icon(
                                CupertinoIcons.ticket,
                                color: AppTheme.primaryColor,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  widget.serviceName,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              '#${ticket.ticketNumber}',
                              style: const TextStyle(
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Status Card
                  Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Icon(
                                _getStatusIcon(ticket.status),
                                color: _getStatusColor(ticket.status),
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Statut actuel',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _getStatusText(ticket.status),
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: _getStatusColor(ticket.status),
                            ),
                          ),
                          if (ticket.position != null) ...[
                            const SizedBox(height: 20),
                            Row(
                              children: [
                                const Icon(
                                  CupertinoIcons.person_2,
                                  color: AppTheme.textSecondary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Position dans la file',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${ticket.position}',
                              style: const TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                          if (ticket.etaMinutes != null) ...[
                            const SizedBox(height: 20),
                            Row(
                              children: [
                                const Icon(
                                  CupertinoIcons.time,
                                  color: AppTheme.textSecondary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Temps d\'attente estimé',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${ticket.etaMinutes} min',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Estimated Time Card
                  if (ticket.etaMinutes != null)
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  CupertinoIcons.clock,
                                  color: AppTheme.textSecondary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Heure estimée de passage',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _calculateEstimatedTime(ticket.etaMinutes!),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  // Actions
                  if (ticket.status == 'called')
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          // TODO: Handle notification
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Colors.green,
                        ),
                        icon: const Icon(Icons.check_circle, color: Colors.white),
                        label: const Text(
                          'J\'arrive !',
                          style: TextStyle(fontSize: 16, color: Colors.white),
                        ),
                      ),
                    )
                  else
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          // TODO: Handle cancel
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: AppTheme.errorColor),
                        ),
                        icon: const Icon(Icons.cancel_outlined, color: AppTheme.errorColor),
                        label: const Text(
                          'Annuler le ticket',
                          style: TextStyle(
                            color: AppTheme.errorColor,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: () async {
                      try {
                        // Try fetching live data; on success, reload screen without initialTicket
                        await ref
                            .read(ticketRealtimeProvider(widget.ticketId).future);
                        if (context.mounted) {
                          Navigator.pushReplacementNamed(
                            context,
                            '/ticket/realtime',
                            arguments: {
                              'ticketId': widget.ticketId,
                              'serviceName': widget.serviceName,
                            },
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                                content: Text(
                                    'Impossible d\'obtenir les données en temps réel.')),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.sync),
                    label: const Text('Actualiser'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final asyncTicket = ref.watch(ticketRealtimeProvider(widget.ticketId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Suivi en temps réel'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: asyncTicket.when(
            data: (ticket) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    // Header Card
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  CupertinoIcons.ticket,
                                  color: AppTheme.primaryColor,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    widget.serviceName,
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                '#${ticket.ticketNumber}',
                                style: const TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Status Card
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Icon(
                                  _getStatusIcon(ticket.status),
                                  color: _getStatusColor(ticket.status),
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Statut actuel',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _getStatusText(ticket.status),
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: _getStatusColor(ticket.status),
                              ),
                            ),
                            if (ticket.position != null) ...[
                              const SizedBox(height: 20),
                              Row(
                                children: [
                                  const Icon(
                                    CupertinoIcons.person_2,
                                    color: AppTheme.textSecondary,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Position dans la file',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${ticket.position}',
                                style: const TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ],
                            if (ticket.etaMinutes != null) ...[
                              const SizedBox(height: 20),
                              Row(
                                children: [
                                  const Icon(
                                    CupertinoIcons.time,
                                    color: AppTheme.textSecondary,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Temps d\'attente estimé',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${ticket.etaMinutes} min',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Estimated Time Card
                  if (ticket.etaMinutes != null)
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  CupertinoIcons.clock,
                                  color: AppTheme.textSecondary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Heure estimée de passage',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _calculateEstimatedTime(ticket.etaMinutes!),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  // Actions
                  if (ticket.status == 'called')
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          // TODO: Handle notification
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Colors.green,
                        ),
                        icon: const Icon(Icons.check_circle, color: Colors.white),
                        label: const Text(
                          'J\'arrive !',
                          style: TextStyle(fontSize: 16, color: Colors.white),
                        ),
                      ),
                    )
                  else
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          // TODO: Handle cancel
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: AppTheme.errorColor),
                        ),
                        icon: const Icon(Icons.cancel_outlined, color: AppTheme.errorColor),
                        label: const Text(
                          'Annuler le ticket',
                          style: TextStyle(
                            color: AppTheme.errorColor,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: () => ref.refresh(ticketRealtimeProvider(widget.ticketId)),
                    icon: const Icon(Icons.sync),
                    label: const Text('Actualiser'),
                  ),
                ],
              ));
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 56,
                      color: AppTheme.errorColor,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Erreur de chargement',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32.0),
                      child: Text(
                        error.toString(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () =>
                            ref.refresh(ticketRealtimeProvider(widget.ticketId)),
                        child: const Text('Réessayer'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'waiting':
        return 'En attente';
      case 'called':
        return 'C\'est votre tour !';
      case 'served':
        return 'Service effectué';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'waiting':
        return CupertinoIcons.time;
      case 'called':
        return CupertinoIcons.bell;
      case 'served':
        return CupertinoIcons.checkmark_circle;
      case 'cancelled':
        return CupertinoIcons.xmark_circle;
      default:
        return CupertinoIcons.question_circle;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'waiting':
        return AppTheme.primaryColor;
      case 'called':
        return Colors.green;
      case 'served':
        return Colors.grey;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  String _calculateEstimatedTime(int etaMinutes) {
    final now = DateTime.now();
    final estimatedTime = now.add(Duration(minutes: etaMinutes));
    return '${_twoDigits(estimatedTime.hour)}:${_twoDigits(estimatedTime.minute)}';
  }

  String _twoDigits(int n) => n.toString().padLeft(2, '0');
}
