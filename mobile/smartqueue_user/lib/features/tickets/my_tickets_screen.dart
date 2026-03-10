import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/repositories/tickets_repository.dart';
import 'package:smartqueue_user/data/models/ticket.dart';

final activeTicketsProvider = FutureProvider.autoDispose((ref) async {
  final api = await ApiClient.create();
  final repo = TicketsRepository(api);
  return repo.active();
});

final historyTicketsProvider = FutureProvider.autoDispose((ref) async {
  final api = await ApiClient.create();
  final repo = TicketsRepository(api);
  return repo.history(perPage: 50);
});

class MyTicketsScreen extends ConsumerStatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  ConsumerState<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends ConsumerState<MyTicketsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _statusText(String status) {
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

  Color _statusColor(String status) {
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

  IconData _statusIcon(String status) {
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

  Widget _ticketCard({required Ticket ticket, bool isActive = false}) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _statusIcon(ticket.status),
                  color: _statusColor(ticket.status),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _statusText(ticket.status),
                    style: TextStyle(
                      color: _statusColor(ticket.status),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  '#${ticket.ticketNumber}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (ticket.service != null)
              Text(
                ticket.service!.name,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            if (ticket.establishment != null) ...[
              const SizedBox(height: 4),
              Text(
                ticket.establishment!.name,
                style: AppTheme.body.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
            const SizedBox(height: 12),
            if (isActive) ...[
              if (ticket.position != null)
                Row(
                  children: [
                    const Icon(
                      CupertinoIcons.person_2,
                      size: 16,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Position: ${ticket.position}',
                      style: AppTheme.caption1.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const Spacer(),
                    if (ticket.etaMinutes != null)
                      Row(
                        children: [
                          const Icon(
                            CupertinoIcons.time,
                            size: 16,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '~${ticket.etaMinutes} min',
                            style: AppTheme.caption1.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      AppRouter.realtime,
                      arguments: {
                        'ticketId': ticket.id,
                        'serviceName': ticket.service?.name ?? 'Service',
                        'ticket': ticket,
                      },
                    );
                  },
                  icon: const Icon(Icons.timer_outlined, size: 18),
                  label: const Text('Suivre en temps réel'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ] else ...[
              const SizedBox(height: 4),
              Text(
                'Pris le ${ticket.createdAt?.day}/${ticket.createdAt?.month}/${ticket.createdAt?.year}',
                style: AppTheme.caption1.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _emptyState({required String title, required String subtitle}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              CupertinoIcons.ticket,
              size: 64,
              color: AppTheme.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: AppTheme.title3.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: AppTheme.body.copyWith(
                color: AppTheme.textSecondary.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final asyncActive = ref.watch(activeTicketsProvider);
    final asyncHistory = ref.watch(historyTicketsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Mes billets'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: const [
            Tab(text: 'En cours'),
            Tab(text: 'Historique'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // En cours
          RefreshIndicator(
            onRefresh: () => ref.refresh(activeTicketsProvider.future),
            child: asyncActive.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _emptyState(
                title: 'Erreur de chargement',
                subtitle: e.toString(),
              ),
              data: (tickets) {
                if (tickets.isEmpty) {
                  return _emptyState(
                    title: 'Aucun billet actif',
                    subtitle: 'Vous n\'avez aucun ticket en cours pour le moment.',
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    final ticket = tickets[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ticketCard(ticket: ticket, isActive: true),
                    );
                  },
                );
              },
            ),
          ),
          // Historique
          RefreshIndicator(
            onRefresh: () => ref.refresh(historyTicketsProvider.future),
            child: asyncHistory.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _emptyState(
                title: 'Erreur de chargement',
                subtitle: e.toString(),
              ),
              data: (tickets) {
                if (tickets.isEmpty) {
                  return _emptyState(
                    title: 'Aucun historique',
                    subtitle: 'Vous n\'avez pas encore de billets terminés.',
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    final ticket = tickets[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ticketCard(ticket: ticket, isActive: false),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
