import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/widgets/cupertino_widgets.dart';
import 'package:smartqueue_user/features/notifications/notifications_provider.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/repositories/notifications_repository.dart';
import 'package:smartqueue_user/core/app_router.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncNotifications = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 16,
                right: 16,
                bottom: 16,
              ),
              child: Row(
                children: [
                  Text(
                    'Notifications',
                    style: AppTheme.title1.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => ref.refresh(notificationsProvider),
                    child: const Icon(
                      CupertinoIcons.refresh,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          asyncNotifications.when(
            data: (notifications) {
              if (notifications.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.bell_slash,
                          size: 80,
                          color: AppTheme.textSecondary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No notifications',
                          style: AppTheme.title3,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'You don\'t have any notifications yet',
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
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final notification = notifications[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: NotificationCard(
                          notification: notification,
                          onTap: () => _handleNotificationTap(
                              context, ref, notification),
                          onDelete: () =>
                              _deleteNotification(context, ref, notification),
                        ),
                      );
                    },
                    childCount: notifications.length,
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
                      'Loading error',
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
                    CupertinoButtonCustom(
                      onPressed: () => ref.refresh(notificationsProvider),
                      filled: true,
                      child: const Text('Retry'),
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

  void _handleNotificationTap(
      BuildContext context, WidgetRef ref, dynamic notification) async {
    try {
      final api = await ApiClient.create();
      final repo = NotificationsRepository(api);
      await repo.markAsRead(notification.id);
    } catch (_) {}

    // Handle navigation based on notification type
    final type = notification.type ?? '';
    final ticketId = notification.ticketId;
    final serviceName = notification.serviceName ?? 'Service';

    if ((type == 'ticket_called' || type == 'ticket_updated') &&
        ticketId != null) {
      if (!context.mounted) return;
      Navigator.pushNamed(
        context,
        AppRouter.ticketDetail,
        arguments: {
          'ticketId': ticketId,
          'serviceName': serviceName,
        },
      );
    } else {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notification opened')),
      );
    }

    // Refresh after opening
    ref.refresh(notificationsProvider);
  }

  Future<void> _deleteNotification(
      BuildContext context, WidgetRef ref, dynamic notification) async {
    try {
      final api = await ApiClient.create();
      final repo = NotificationsRepository(api);
      await repo.delete(notification.id);
      // Refresh list after deletion
      ref.refresh(notificationsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  'Delete failed: ${e.toString().replaceFirst('Exception: ', '')}')),
        );
      }
    }
  }
}

class NotificationCard extends StatelessWidget {
  final dynamic notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const NotificationCard({
    super.key,
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'ticket_called':
        return CupertinoIcons.bell_fill;
      case 'ticket_updated':
        return CupertinoIcons.refresh;
      case 'announcement':
        return CupertinoIcons.speaker_2_fill;
      default:
        return CupertinoIcons.bell;
    }
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'ticket_called':
        return AppTheme.successColor;
      case 'ticket_updated':
        return AppTheme.primaryColor;
      case 'announcement':
        return AppTheme.warningColor;
      default:
        return AppTheme.primaryColor;
    }
  }

  String _relativeTime(DateTime? dt) {
    if (dt == null) return '';
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return "just now";
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} h ago';
    if (diff.inDays < 7) return '${diff.inDays} d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final color = _getNotificationColor(notification.type);

    return Dismissible(
      key: ValueKey(notification.id),
      background: Container(
        color: AppTheme.errorColor,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(
          CupertinoIcons.delete,
          color: Colors.white,
        ),
      ),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) async {
        onDelete();
        return true;
      },
      child: CupertinoCard(
        onTap: onTap,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                _getNotificationIcon(notification.type),
                color: color,
                size: 20,
              ),
            ),

            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: AppTheme.body.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  if (notification.body != null)
                    Text(
                      notification.body,
                      style: AppTheme.callout.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 4),
                  Text(
                    _relativeTime(notification.createdAt),
                    style: AppTheme.caption1.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
