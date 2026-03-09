import 'package:flutter/cupertino.dart';
import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/widgets/cupertino_widgets.dart';

import '../../../data/models/establishment.dart';

class EstablishmentCard extends StatelessWidget {
  final Establishment establishment;

  const EstablishmentCard({super.key, required this.establishment});

  String _getAffluenceText(String affluence) {
    switch (affluence.toLowerCase()) {
      case 'low':
        return 'Peu fréquenté';
      case 'high':
        return 'Très fréquenté';
      case 'medium':
      default:
        return 'Fréquentation moyenne';
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
    return CupertinoCard(
      onTap: () => Navigator.pushNamed(
        context,
        AppRouter.services,
        arguments: {
          'establishmentId': establishment.id,
          'establishmentName': establishment.name,
        },
      ),
      child: Row(
        children: [
          // Logo/Icon style iOS
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppTheme.borderRadiusMedium),
            ),
            child: Icon(
              CupertinoIcons.building_2_fill,
              size: 28,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(width: 16),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  establishment.name,
                  style: AppTheme.headline,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (establishment.address != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6.0),
                    child: Text(
                      establishment.address!,
                      style: AppTheme.footnote.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getAffluenceColor(establishment.affluence)
                            .withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _getAffluenceColor(establishment.affluence),
                          width: 0.5,
                        ),
                      ),
                      child: Text(
                        _getAffluenceText(establishment.affluence),
                        style: AppTheme.caption1.copyWith(
                          color: _getAffluenceColor(establishment.affluence),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (establishment.distance != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.backgroundColor,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              CupertinoIcons.location,
                              size: 12,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${establishment.distance!.toStringAsFixed(1)} km',
                              style: AppTheme.caption1.copyWith(
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Icon(
            CupertinoIcons.chevron_forward,
            color: AppTheme.textSecondary.withOpacity(0.5),
            size: 16,
          ),
        ],
      ),
    );
  }
}
