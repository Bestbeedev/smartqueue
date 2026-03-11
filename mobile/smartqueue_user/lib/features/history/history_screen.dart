// features/history/history_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/widgets/cupertino_widgets.dart';
import 'package:smartqueue_user/features/history/history_provider.dart';
import 'package:smartqueue_user/core/app_router.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncHistory = ref.watch(historyTicketsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header with iOS style
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 20,
                right: 20,
                bottom: 20,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ticket History',
                          style: AppTheme.title1.copyWith(
                            fontWeight: FontWeight.bold,
                            fontSize: 32,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your completed and cancelled tickets',
                          style: AppTheme.callout.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => ref.refresh(historyTicketsProvider),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppTheme.dividerColor.withOpacity(0.2),
                        ),
                      ),
                      child: const Icon(
                        CupertinoIcons.refresh,
                        color: AppTheme.primaryColor,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          asyncHistory.when(
            data: (tickets) {
              if (tickets.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.clock,
                          size: 80,
                          color: AppTheme.textSecondary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No ticket history',
                          style: AppTheme.title3,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Your previous tickets will appear here',
                          style: AppTheme.callout.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final ticket = tickets[index];
                      final isLast = index == tickets.length - 1;
                      
                      return Padding(
                        padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
                        child: HistoryTicketCard(ticket: ticket),
                      );
                    },
                    childCount: tickets.length,
                  ),
                ),
              );
            },
            loading: () => const SliverFillRemaining(
              child: Center(child: CupertinoActivityIndicator()),
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
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => ref.refresh(historyTicketsProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class HistoryTicketCard extends StatelessWidget {
  final dynamic ticket;

  const HistoryTicketCard({super.key, required this.ticket});

  String _getStatusText(String status) {
    switch (status) {
      case 'served':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      case 'closed':
        return 'Completed';
      default:
        return status;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'served':
      case 'closed':
        return CupertinoIcons.check_mark_circled;
      case 'cancelled':
        return CupertinoIcons.xmark_circle_fill;
      case 'no_show':
        return CupertinoIcons.person_crop_circle_badge_xmark;
      default:
        return CupertinoIcons.clock;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'served':
      case 'closed':
        return AppTheme.successColor;
      case 'cancelled':
        return AppTheme.errorColor;
      case 'no_show':
        return AppTheme.warningColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    return '${dt.day} ${_getMonth(dt.month)} ${dt.year}';
  }

  String _getMonth(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(ticket.status);

    return CupertinoCard(
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
          // Header with establishment and status
          Row(
            children: [
              Expanded(
                child: Text(
                  ticket.serviceName ?? 'Unknown Service',
                  style: AppTheme.headline.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: statusColor.withOpacity(0.3),
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
            ],
          ),

          const SizedBox(height: 12),

          // Ticket number and date
          Row(
            children: [
              Icon(
                CupertinoIcons.ticket,
                size: 16,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                'Ticket ${ticket.ticketNumber}',
                style: AppTheme.callout.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
              const Spacer(),
              Icon(
                CupertinoIcons.calendar,
                size: 16,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                _formatDate(ticket.updatedAt),
                style: AppTheme.callout.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Status icon and text
          Row(
            children: [
              Icon(
                _getStatusIcon(ticket.status),
                size: 16,
                color: statusColor,
              ),
              const SizedBox(width: 4),
              Text(
                _getStatusText(ticket.status),
                style: AppTheme.callout.copyWith(
                  color: statusColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
