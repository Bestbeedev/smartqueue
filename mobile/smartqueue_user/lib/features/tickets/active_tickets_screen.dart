import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../../core/app_router.dart';
import '../../data/models/ticket.dart';
import 'active_tickets_provider.dart';

/// Tickets actifs (maquette): liste des tickets en cours
class ActiveTicketsScreen extends ConsumerWidget {
  const ActiveTicketsScreen({super.key});

  String _statusText(String status) {
    switch (status) {
      case 'waiting':
        return 'En attente';
      case 'called':
        return 'C\'est votre tour';
      case 'served':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'waiting':
        return AppTheme.warningColor;
      case 'called':
        return AppTheme.successColor;
      case 'served':
        return Colors.grey;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  Widget _statusChip(String status) {
    final c = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.withValues(alpha: 0.25)),
      ),
      child: Text(
        _statusText(status),
        style: AppTheme.caption1.copyWith(
          color: c,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _ticketCard(BuildContext context, Ticket t) {
    return CupertinoCard(
      onTap: () {
        Navigator.pushNamed(
          context,
          AppRouter.realtime,
          arguments: {
            'ticketId': t.id,
            'serviceName': t.service?.name ?? 'Service',
            'ticket': t,
          },
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  t.service?.name ?? 'Service',
                  style: AppTheme.headline.copyWith(fontWeight: FontWeight.w700),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              _statusChip(t.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            t.establishment?.name ?? '',
            style: AppTheme.callout.copyWith(color: AppTheme.textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '#${t.ticketNumber}',
                style: AppTheme.title2.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryColor,
                ),
              ),
              const Spacer(),
              if (t.position != null) ...[
                const Icon(CupertinoIcons.person_2, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${t.position}',
                  style: AppTheme.callout.copyWith(color: AppTheme.textSecondary),
                ),
                const SizedBox(width: 12),
              ],
              if (t.etaMinutes != null) ...[
                const Icon(CupertinoIcons.time, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '~${t.etaMinutes} min',
                  style: AppTheme.callout.copyWith(color: AppTheme.textSecondary),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  AppRouter.realtime,
                  arguments: {
                    'ticketId': t.id,
                    'serviceName': t.service?.name ?? 'Service',
                    'ticket': t,
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
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTickets = ref.watch(activeTicketsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 16,
                right: 16,
                bottom: 8,
              ),
              child: Row(
                children: [
                  Text(
                    'Tickets actifs',
                    style: AppTheme.title1.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => ref.refresh(activeTicketsProvider),
                    child: const Icon(
                      CupertinoIcons.refresh,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
          asyncTickets.when(
            loading: () => const SliverFillRemaining(
              child: Center(child: CupertinoActivityIndicator()),
            ),
            error: (e, _) => SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        CupertinoIcons.exclamationmark_triangle,
                        color: AppTheme.errorColor,
                        size: 48,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Erreur de chargement',
                        style: AppTheme.title3.copyWith(
                          color: AppTheme.errorColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        e.toString(),
                        textAlign: TextAlign.center,
                        style: AppTheme.callout.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      CupertinoButtonCustom(
                        onPressed: () => ref.refresh(activeTicketsProvider),
                        filled: true,
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            data: (tickets) {
              if (tickets.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            CupertinoIcons.ticket,
                            size: 72,
                            color: AppTheme.textSecondary.withValues(alpha: 0.6),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Aucun ticket actif',
                            style: AppTheme.title3,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Vos tickets en cours apparaîtront ici.',
                            textAlign: TextAlign.center,
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final t = tickets[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _ticketCard(context, t),
                      );
                    },
                    childCount: tickets.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
