import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/service.dart';
import '../../core/app_router.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import 'services_provider.dart';

/// Establishment Details Page with services
class ServicesScreen extends ConsumerWidget {
  final int establishmentId;
  final String establishmentName;

  const ServicesScreen(
      {super.key,
      required this.establishmentId,
      required this.establishmentName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncServices =
        ref.watch(servicesByEstablishmentProvider(establishmentId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header with establishment info
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 16,
                right: 16,
                bottom: 24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Back button and title
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
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          establishmentName,
                          style: AppTheme.title1.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Address and rating
                  Row(
                    children: [
                      Icon(
                        CupertinoIcons.location,
                        size: 16,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '123 Main Street, City',
                        style: AppTheme.callout.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const Spacer(),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            CupertinoIcons.star_fill,
                            color: AppTheme.warningColor,
                            size: 16,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '4.5',
                            style: AppTheme.callout.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Services available title
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Services disponibles',
                style: AppTheme.headline.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Services list
          asyncServices.when(
            loading: () => const SliverFillRemaining(
              child: Center(child: CupertinoActivityIndicator()),
            ),
            error: (e, _) => SliverFillRemaining(
              child: Center(
                child: Text(
                  'Erreur: $e',
                  style: AppTheme.body.copyWith(color: AppTheme.errorColor),
                ),
              ),
            ),
            data: (services) {
              if (services.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'Aucun service disponible',
                      style: AppTheme.body,
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final service = services[index];
                      final isOpen = service.status == 'open';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: CupertinoCard(
                          onTap: isOpen
                              ? () => Navigator.pushNamed(
                                    context,
                                    AppRouter.serviceDetail,
                                    arguments: {
                                      'serviceId': service.id,
                                      'serviceName': service.name,
                                    },
                                  )
                              : null,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Service name and status
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      service.name,
                                      style: AppTheme.headline.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isOpen
                                          ? AppTheme.successColor
                                              .withOpacity(0.1)
                                          : AppTheme.errorColor
                                              .withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isOpen
                                            ? AppTheme.successColor
                                                .withOpacity(0.3)
                                            : AppTheme.errorColor
                                                .withOpacity(0.3),
                                      ),
                                    ),
                                    child: Text(
                                      isOpen ? 'Ouvert' : 'Fermé',
                                      style: AppTheme.caption1.copyWith(
                                        color: isOpen
                                            ? AppTheme.successColor
                                            : AppTheme.errorColor,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Waiting time and button
                              Row(
                                children: [
                                  Icon(
                                    CupertinoIcons.time,
                                    size: 16,
                                    color: AppTheme.textSecondary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Attente: ${service.avgServiceTimeMinutes} min',
                                    style: AppTheme.callout.copyWith(
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                  const Spacer(),
                                  if (isOpen)
                                    SizedBox(
                                      width: 120,
                                      child: CupertinoButtonCustom(
                                        onPressed: () => Navigator.pushNamed(
                                          context,
                                          AppRouter.takeTicket,
                                          arguments: {
                                            'serviceId': service.id,
                                            'serviceName': service.name,
                                          },
                                        ),
                                        filled: true,
                                        child: Text(
                                          'Prendre un ticket',
                                          style: AppTheme.caption1.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: services.length,
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
