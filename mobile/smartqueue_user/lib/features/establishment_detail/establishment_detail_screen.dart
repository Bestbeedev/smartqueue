import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/geo_utils.dart';
import 'package:smartqueue_user/core/widgets/cupertino_widgets.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/repositories/establishments_repository.dart';
import 'package:smartqueue_user/features/establishments/establishments_provider.dart';

final establishmentDetailProvider =
    FutureProvider.family((ref, int establishmentId) async {
  final api = await ApiClient.create();
  final repo = EstablishmentsRepository(api);
  return repo.byId(establishmentId);
});

class EstablishmentDetailScreen extends ConsumerWidget {
  final int establishmentId;

  const EstablishmentDetailScreen({super.key, required this.establishmentId});

  Widget _specCard({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return CupertinoCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.primaryColor),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.caption1.copyWith(
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: AppTheme.body.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncEst = ref.watch(establishmentDetailProvider(establishmentId));
    final asyncNearby = ref.watch(nearbyEstablishmentsProvider);

    final Position? userPos = asyncNearby.when(
      loading: () => null,
      error: (_, __) => null,
      data: (r) => r.position,
    );

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        bottom: false,
        child: asyncEst.when(
          loading: () => const Center(child: CupertinoActivityIndicator()),
          error: (e, _) => Center(
            child: Text(
              'Erreur: $e',
              style: AppTheme.body.copyWith(color: AppTheme.errorColor),
            ),
          ),
          data: (est) {
            final canComputeDistance =
                userPos != null && est.lat != null && est.lng != null;
            final distanceM = canComputeDistance
                ? GeoUtils.distanceMeters(
                    lat1: userPos.latitude,
                    lng1: userPos.longitude,
                    lat2: est.lat!,
                    lng2: est.lng!,
                  )
                : null;
            final etas = distanceM != null
                ? GeoUtils.etaMinutesAllModes(distanceM)
                : null;

            return CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
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
                            est.name,
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
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (est.address != null) ...[
                          Text(
                            est.address!,
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        Text(
                          'Localisation',
                          style: AppTheme.headline.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final isWide = constraints.maxWidth >= 560;
                            final itemWidth = isWide
                                ? (constraints.maxWidth - 12) / 2
                                : constraints.maxWidth;

                            return Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: [
                                SizedBox(
                                  width: itemWidth,
                                  child: _specCard(
                                    icon: CupertinoIcons.location,
                                    title: 'Distance',
                                    value: distanceM != null
                                        ? '${(distanceM / 1000).toStringAsFixed(2)} km'
                                        : 'Indisponible',
                                  ),
                                ),
                                SizedBox(
                                  width: itemWidth,
                                  child: _specCard(
                                    icon: CupertinoIcons.person,
                                    title: 'À pied',
                                    value: etas != null
                                        ? '${etas[TravelModeHeuristic.walk]} min'
                                        : 'Indisponible',
                                  ),
                                ),
                                SizedBox(
                                  width: itemWidth,
                                  child: _specCard(
                                    icon: Icons.two_wheeler_outlined,
                                    title: 'Moto',
                                    value: etas != null
                                        ? '${etas[TravelModeHeuristic.moto]} min'
                                        : 'Indisponible',
                                  ),
                                ),
                                SizedBox(
                                  width: itemWidth,
                                  child: _specCard(
                                    icon: CupertinoIcons.car,
                                    title: 'Voiture',
                                    value: etas != null
                                        ? '${etas[TravelModeHeuristic.car]} min'
                                        : 'Indisponible',
                                  ),
                                ),
                                SizedBox(
                                  width: itemWidth,
                                  child: _specCard(
                                    icon: CupertinoIcons.map_pin_ellipse,
                                    title: 'Coordonnées',
                                    value: (est.lat != null && est.lng != null)
                                        ? '${est.lat!.toStringAsFixed(6)}, ${est.lng!.toStringAsFixed(6)}'
                                        : 'Indisponible',
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: CupertinoButtonCustom(
                            filled: true,
                            onPressed: () => Navigator.pushNamed(
                              context,
                              AppRouter.services,
                              arguments: {
                                'establishmentId': est.id,
                                'establishmentName': est.name,
                              },
                            ),
                            child: Text(
                              'Voir les services',
                              style: AppTheme.body.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
