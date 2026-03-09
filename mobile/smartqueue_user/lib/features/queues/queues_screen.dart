import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../establishments/establishments_provider.dart';
import '../establishments/widgets/establishment_card.dart';
import '../services/services_screen.dart';

/// Queues Screen - Available queues across all establishments
class QueuesScreen extends ConsumerWidget {
  const QueuesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncEstablishments = ref.watch(nearbyEstablishmentsProvider);

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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Available Queues',
                    style: AppTheme.title1.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Browse all available queues near you',
                    style: AppTheme.callout.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Content
          asyncEstablishments.when(
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
                  ],
                ),
              ),
            ),
            data: (establishments) {
              if (establishments.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.location,
                          size: 64,
                          color: AppTheme.textSecondary,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No queues available',
                          style: AppTheme.title3,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Try enabling your location or expanding the search area.',
                          textAlign: TextAlign.center,
                          style: AppTheme.callout,
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
                      final establishment = establishments[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: QueueCard(establishment: establishment),
                      );
                    },
                    childCount: establishments.length,
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

class QueueCard extends StatelessWidget {
  final dynamic establishment;

  const QueueCard({super.key, required this.establishment});

  @override
  Widget build(BuildContext context) {
    return CupertinoCard(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ServicesScreen(
            establishmentId: establishment.id,
            establishmentName: establishment.name,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with name and status
          Row(
            children: [
              Expanded(
                child: Text(
                  establishment.name,
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
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.successColor.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      CupertinoIcons.circle_fill,
                      size: 8,
                      color: AppTheme.successColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Open',
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

          const SizedBox(height: 12),

          // Queue info
          Row(
            children: [
              Icon(
                CupertinoIcons.person_2,
                size: 16,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                '${establishment.peopleWaiting ?? 5} in queue',
                style: AppTheme.callout.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
              const Spacer(),
              Icon(
                CupertinoIcons.time,
                size: 16,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                '~${15 + (establishment.peopleWaiting ?? 0)} min',
                style: AppTheme.callout.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Action button
          SizedBox(
            width: double.infinity,
            child: CupertinoButtonCustom(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ServicesScreen(
                    establishmentId: establishment.id,
                    establishmentName: establishment.name,
                  ),
                ),
              ),
              filled: true,
              child: Text(
                'View Services',
                style: AppTheme.button.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
