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
        return 'Low';
      case 'high':
        return 'High';
      case 'medium':
      default:
        return 'Medium';
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

          const SizedBox(height: 12),

          // Stats row
          Row(
            children: [
              // Waiting time
              Container(
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
                    Icon(
                      CupertinoIcons.time,
                      size: 14,
                      color: AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Waiting: ${15 + (establishment.peopleWaiting ?? 0)} min',
                      style: AppTheme.caption1.copyWith(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // People in queue
              Container(
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
                    Icon(
                      CupertinoIcons.person_2,
                      size: 14,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${establishment.peopleWaiting ?? 5} people in queue',
                      style: AppTheme.caption1.copyWith(
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
