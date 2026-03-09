import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/ticket.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../../core/app_router.dart';
import 'active_tickets_provider.dart';

/// Tickets actifs de l'utilisateur avec design iOS Cupertino
class ActiveTicketsScreen extends ConsumerWidget {
  const ActiveTicketsScreen({super.key});

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'called':
        return AppTheme.primaryColor;
      case 'waiting':
        return AppTheme.warningColor;
      case 'serving':
        return AppTheme.successColor;
      case 'absent':
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'called':
        return 'Appelé';
      case 'waiting':
        return 'En attente';
      case 'serving':
        return 'En service';
      case 'absent':
        return 'Absent';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTickets = ref.watch(activeTicketsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header style iOS
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 16,
                right: 16,
                bottom: 16,
              ),
              decoration: BoxDecoration(
                color: AppTheme.navigationBarColor,
                border: Border(
                  bottom: BorderSide(
                    color: AppTheme.dividerColor.withOpacity(0.3),
                    width: 0.5,
                  ),
                ),
                boxShadow: AppTheme.navigationShadow,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mes tickets',
                          style: AppTheme.largeTitle,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Tickets en cours',
                          style: AppTheme.subheadline.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => Navigator.pushNamed(context, AppRouter.history),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        CupertinoIcons.clock,
                        color: AppTheme.primaryColor,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Contenu principal
          asyncTickets.when(
            loading: () => SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CupertinoActivityIndicator(radius: 16),
                    const SizedBox(height: 16),
                    Text(
                      'Chargement...',
                      style: AppTheme.body.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            error: (error, _) => SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      CupertinoIcons.exclamationmark_triangle,
                      color: AppTheme.errorColor,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erreur de chargement',
                      style: AppTheme.title3.copyWith(
                        color: AppTheme.errorColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32.0),
                      child: Text(
                        error.toString(),
                        textAlign: TextAlign.center,
                        style: AppTheme.callout.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            data: (data) {
              final tickets = data.cast<Ticket>();
              if (tickets.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.ticket,
                          size: 64,
                          color: AppTheme.textSecondary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Aucun ticket actif',
                          style: AppTheme.title3,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Prenez un ticket pour commencer',
                          style: AppTheme.callout.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final ticket = tickets[index];
                    final statusColor = _getStatusColor(ticket.status);
                    
                    return CupertinoCard(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          AppRouter.ticketDetail,
                          arguments: {
                            'ticketId': ticket.id,
                            'serviceName': ticket.serviceName,
                            'ticket': ticket,
                          },
                        );
                      },
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              // Status indicator
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: statusColor,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Ticket number
                              Expanded(
                                child: Text(
                                  'Ticket ${ticket.ticketNumber}',
                                  style: AppTheme.headline,
                                ),
                              ),
                              // Chevron
                              Icon(
                                CupertinoIcons.chevron_forward,
                                color: AppTheme.textSecondary.withOpacity(0.5),
                                size: 16,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          // Service name
                          if (ticket.serviceName != null) ...[
                            Text(
                              ticket.serviceName!,
                              style: AppTheme.callout.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],
                          // Status and details
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: statusColor,
                                    width: 0.5,
                                  ),
                                ),
                                child: Text(
                                  _getStatusText(ticket.status),
                                  style: AppTheme.caption1.copyWith(
                                    color: statusColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              if (ticket.position != null) ...[
                                const SizedBox(width: 8),
                                Text(
                                  'Position: ${ticket.position}',
                                  style: AppTheme.footnote.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          if (ticket.etaMinutes != null) ...[
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(
                                  CupertinoIcons.time,
                                  size: 14,
                                  color: AppTheme.textSecondary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Temps estimé: ${ticket.etaMinutes} min',
                                  style: AppTheme.footnote.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                  childCount: tickets.length,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
