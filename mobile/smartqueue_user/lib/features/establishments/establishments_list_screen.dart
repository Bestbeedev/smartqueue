import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/features/establishments/establishments_provider.dart';
import 'package:smartqueue_user/features/establishments/widgets/establishment_card.dart';

class EstablishmentsListScreen extends ConsumerStatefulWidget {
  final String? initialCategory;
  const EstablishmentsListScreen({super.key, this.initialCategory});

  @override
  ConsumerState<EstablishmentsListScreen> createState() =>
      _EstablishmentsListScreenState();
}

class _EstablishmentsListScreenState
    extends ConsumerState<EstablishmentsListScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(selectedEstablishmentCategoryProvider.notifier)
          .set(widget.initialCategory);
      ref.invalidate(nearbyEstablishmentsProvider);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _categoryLabel(String? value) {
    switch (value) {
      case 'banking':
        return 'Banque';
      case 'health':
        return 'Santé';
      case 'public':
        return 'Public';
      case 'social':
        return 'Social';
      default:
        return value ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedCategory = ref.watch(selectedEstablishmentCategoryProvider);
    final asyncNearby = ref.watch(nearbyEstablishmentsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
                child: Row(
                  children: [
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      onPressed: () => Navigator.pop(context),
                      child: const Icon(
                        CupertinoIcons.back,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Établissements',
                        style: AppTheme.title1.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppTheme.dividerColor.withOpacity(0.3),
                        ),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (value) => setState(() {
                          _query = value.toLowerCase();
                        }),
                        decoration: InputDecoration(
                          hintText: 'Rechercher',
                          hintStyle: AppTheme.body.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                          prefixIcon: Icon(
                            CupertinoIcons.search,
                            color: AppTheme.textSecondary,
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ),
                    if (selectedCategory != null) ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceColor,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: AppTheme.dividerColor.withOpacity(0.25),
                              ),
                            ),
                            child: Text(
                              _categoryLabel(selectedCategory),
                              style: AppTheme.callout.copyWith(
                                color: AppTheme.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          CupertinoButton(
                            padding: EdgeInsets.zero,
                            minSize: 32,
                            onPressed: () {
                              ref
                                  .read(selectedEstablishmentCategoryProvider
                                      .notifier)
                                  .clear();
                              ref.invalidate(nearbyEstablishmentsProvider);
                            },
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceColor,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color:
                                      AppTheme.dividerColor.withOpacity(0.25),
                                ),
                              ),
                              child: const Icon(
                                CupertinoIcons.xmark,
                                size: 16,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            asyncNearby.when(
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
              data: (nearby) {
                final list = nearby.establishments.where((e) {
                  if (_query.isEmpty) return true;
                  final name = e.name.toLowerCase();
                  final addr = (e.address ?? '').toLowerCase();
                  return name.contains(_query) || addr.contains(_query);
                }).toList();

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final establishment = list[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () {
                              AppRouter.navigatorKey.currentState?.pushNamed(
                                AppRouter.establishmentDetail,
                                arguments: {
                                  'establishmentId': establishment.id,
                                },
                              );
                            },
                            child: EstablishmentCard(
                              establishment: establishment,
                              userLat: nearby.position?.latitude,
                              userLng: nearby.position?.longitude,
                              compact: true,
                            ),
                          ),
                        );
                      },
                      childCount: list.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
