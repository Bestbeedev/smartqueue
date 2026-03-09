import 'package:flutter/cupertino.dart';
import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/geo_utils.dart';
import 'package:smartqueue_user/core/widgets/cupertino_widgets.dart';

import '../../../data/models/establishment.dart';

class EstablishmentCard extends StatelessWidget {
  final Establishment establishment;
  final double? userLat;
  final double? userLng;

  const EstablishmentCard({
    super.key,
    required this.establishment,
    this.userLat,
    this.userLng,
  });

  String _getAffluenceText(String affluence) {
    switch (affluence.toLowerCase()) {
      case 'low':
        return 'Faible';
      case 'high':
        return 'Élevée';
      case 'medium':
      default:
        return 'Moyenne';
    }
  }

  Color _getAffluenceColor(String affluence) {
    switch (affluence.toLowerCase()) {
      case 'low':
        return AppTheme.successColor;
      case 'high':
        return AppTheme.errorColor;
      case 'medium':
      default:
        return AppTheme.warningColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    final canComputeDistance =
        userLat != null && userLng != null && establishment.lat != null && establishment.lng != null;

    final distanceM = canComputeDistance
        ? GeoUtils.distanceMeters(
            lat1: userLat!,
            lng1: userLng!,
            lat2: establishment.lat!,
            lng2: establishment.lng!,
          )
        : null;
    final etaMin = distanceM != null ? GeoUtils.etaMinutesHeuristic(distanceM) : null;

    return CupertinoCard(
      onTap: () => Navigator.pushNamed(
        context,
        AppRouter.services,
        arguments: {
          'establishmentId': establishment.id,
          'establishmentName': establishment.name,
        },
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with name and rating
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
              const SizedBox(width: 8),
              // Rating stars
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
                    style: AppTheme.caption1.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Address
          if (establishment.address != null)
            Text(
              establishment.address!,
              style: AppTheme.callout.copyWith(
                color: AppTheme.textSecondary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

          if (distanceM != null && etaMin != null) ...[
            const SizedBox(height: 8),
            Text(
              '${(distanceM / 1000).toStringAsFixed(1)} km • ~${etaMin} min',
              style: AppTheme.caption1.copyWith(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          const SizedBox(height: 12),

          // Affluence level indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _getAffluenceColor(establishment.affluence)
                  .withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _getAffluenceColor(establishment.affluence)
                    .withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _getAffluenceColor(establishment.affluence),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Affluence: ${_getAffluenceText(establishment.affluence)}',
                  style: AppTheme.caption1.copyWith(
                    color: _getAffluenceColor(establishment.affluence),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Stats row
          Row(
            children: [
              // Waiting time
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        CupertinoIcons.time,
                        size: 14,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          'Attente: ${15 + (establishment.peopleWaiting ?? 0)} min',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.caption1.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // People in queue
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppTheme.dividerColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        CupertinoIcons.person_2,
                        size: 14,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '${establishment.peopleWaiting ?? 5} personnes en attente',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.caption1.copyWith(
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
