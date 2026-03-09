// features/home/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../establishments/establishments_provider.dart';
import '../../core/app_router.dart';
import '../establishments/widgets/establishment_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncNearby = ref.watch(nearbyEstablishmentsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header with greeting and search
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
                  // Greeting
                  Text(
                    'Bonjour Josué 👋',
                    style: AppTheme.title1.copyWith(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Search bar
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: AppTheme.dividerColor.withOpacity(0.3)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (value) {
                        setState(() {
                          _searchQuery = value.toLowerCase();
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Rechercher un établissement...',
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

                  const SizedBox(height: 24),

                  // Quick access to features
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Fonctionnalités',
                          style: AppTheme.headline.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            // Live Map
                            Expanded(
                              child: CupertinoCard(
                                onTap: () {
                                  debugPrint('Home feature tap: liveMap');
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Live Map')),
                                  );
                                  AppRouter.navigatorKey.currentState
                                      ?.pushNamed(AppRouter.liveMap);
                                },
                                child: Column(
                                  children: [
                                    Container(
                                      width: 50,
                                      height: 50,
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor
                                            .withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(16),
                                      ),
                                      child: const Icon(
                                        CupertinoIcons.location,
                                        color: AppTheme.primaryColor,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Live Map',
                                      style: AppTheme.callout.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // AI Predictions
                            Expanded(
                              child: CupertinoCard(
                                onTap: () {
                                  debugPrint(
                                      'Home feature tap: predictiveWaiting');
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text('IA Prédictions')),
                                  );
                                  AppRouter.navigatorKey.currentState
                                      ?.pushNamed(AppRouter.predictiveWaiting);
                                },
                                child: Column(
                                  children: [
                                    Container(
                                      width: 50,
                                      height: 50,
                                      decoration: BoxDecoration(
                                        color: AppTheme.warningColor
                                            .withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(16),
                                      ),
                                      child: const Icon(
                                        CupertinoIcons.chart_bar,
                                        color: AppTheme.warningColor,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'IA Prédictions',
                                      style: AppTheme.callout.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            // QR Scanner
                            Expanded(
                              child: CupertinoCard(
                                onTap: () {
                                  debugPrint('Home feature tap: qr');
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Scanner QR')),
                                  );
                                  AppRouter.navigatorKey.currentState
                                      ?.pushNamed(AppRouter.qr);
                                },
                                child: Column(
                                  children: [
                                    Container(
                                      width: 50,
                                      height: 50,
                                      decoration: BoxDecoration(
                                        color: AppTheme.successColor
                                            .withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(16),
                                      ),
                                      child: const Icon(
                                        CupertinoIcons.qrcode_viewfinder,
                                        color: AppTheme.successColor,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Scanner QR',
                                      style: AppTheme.callout.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(child: SizedBox.shrink()),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Nearby establishments title
                  Text(
                    'Établissements à proximité',
                    style: AppTheme.headline.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          asyncNearby.when(
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
            data: (nearby) {
              if (nearby.status == NearbyEstablishmentsStatus.locationServiceDisabled) {
                return SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            CupertinoIcons.location_slash,
                            size: 64,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Localisation désactivée',
                            style: AppTheme.title3,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Active la localisation de ton téléphone pour voir les établissements à proximité.',
                            textAlign: TextAlign.center,
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 24),
                          CupertinoButtonCustom(
                            onPressed: () => ref.refresh(nearbyEstablishmentsProvider),
                            filled: true,
                            child: const Text('Réessayer'),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              if (nearby.status == NearbyEstablishmentsStatus.permissionDenied ||
                  nearby.status == NearbyEstablishmentsStatus.permissionDeniedForever) {
                return SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32.0),
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
                            'Autorisation requise',
                            style: AppTheme.title3,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Autorise la localisation pour afficher les établissements proches.',
                            textAlign: TextAlign.center,
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 24),
                          CupertinoButtonCustom(
                            onPressed: () => ref.refresh(nearbyEstablishmentsProvider),
                            filled: true,
                            child: const Text('Autoriser'),
                          ),

                          if (nearby.status == NearbyEstablishmentsStatus.permissionDeniedForever) ...[
                            const SizedBox(height: 12),
                            CupertinoButtonCustom(
                              onPressed: () async {
                                await Geolocator.openAppSettings();
                                await Geolocator.openLocationSettings();
                              },
                              filled: false,
                              child: const Text('Ouvrir les réglages'),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              }

              final establishments = nearby.establishments;
              // Filter establishments based on search
              final filteredEstablishments = _searchQuery.isEmpty
                  ? establishments
                  : establishments
                      .where((est) =>
                          est.name.toLowerCase().contains(_searchQuery) ||
                          (est.address?.toLowerCase().contains(_searchQuery) ??
                              false))
                      .toList();

              if (filteredEstablishments.isEmpty) {
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
                          _searchQuery.isEmpty
                              ? 'Aucun établissement à proximité'
                              : 'Aucun établissement trouvé',
                          style: AppTheme.title3,
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32.0),
                          child: Text(
                            _searchQuery.isEmpty
                                ? 'Essayez d\'activer votre localisation ou d\'élargir la zone de recherche.'
                                : 'Essayez d\'autres termes de recherche.',
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

              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final establishment = filteredEstablishments[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: EstablishmentCard(
                          establishment: establishment,
                          userLat: nearby.position?.latitude,
                          userLng: nearby.position?.longitude,
                        ),
                      );
                    },
                    childCount: filteredEstablishments.length,
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
