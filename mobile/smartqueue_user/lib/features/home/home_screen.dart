// features/home/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../establishments/establishments_provider.dart';
import '../establishments/widgets/establishment_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncEstablishments = ref.watch(nearbyEstablishmentsProvider);

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
                          'SmartQueue',
                          style: AppTheme.largeTitle.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Établissements à proximité',
                          style: AppTheme.subheadline.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    onPressed: () => ref.refresh(nearbyEstablishmentsProvider),
                    padding: EdgeInsets.zero,
                    child: Icon(
                      CupertinoIcons.refresh,
                      color: AppTheme.primaryColor,
                      size: 24,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Contenu principal
          asyncEstablishments.when(
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
                    const SizedBox(height: 24),
                    CupertinoButtonCustom(
                      onPressed: () =>
                          ref.refresh(nearbyEstablishmentsProvider),
                      filled: true,
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
            ),
            data: (establishments) {
              if (establishments.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.location,
                          size: 64,
                          color: AppTheme.textSecondary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Aucun établissement à proximité',
                          style: AppTheme.title3,
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32.0),
                          child: Text(
                            'Essayez d\'activer votre localisation ou d\'élargir la zone de recherche.',
                            textAlign: TextAlign.center,
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
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
                    final establishment = establishments[index];
                    return EstablishmentCard(establishment: establishment);
                  },
                  childCount: establishments.length,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
