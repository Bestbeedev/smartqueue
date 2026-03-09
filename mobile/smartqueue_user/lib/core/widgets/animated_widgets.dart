import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../core/app_theme.dart';

/// Widget d'animation de ticket avec effet de pulsation
class AnimatedTicketCard extends StatefulWidget {
  final String ticketNumber;
  final String? serviceName;
  final String status;
  final int? position;
  final int? etaMinutes;
  final VoidCallback? onTap;

  const AnimatedTicketCard({
    super.key,
    required this.ticketNumber,
    this.serviceName,
    required this.status,
    this.position,
    this.etaMinutes,
    this.onTap,
  });

  @override
  State<AnimatedTicketCard> createState() => _AnimatedTicketCardState();
}

class _AnimatedTicketCardState extends State<AnimatedTicketCard>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _shimmerController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _shimmerController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _shimmerAnimation = Tween<double>(
      begin: -1.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _shimmerController,
      curve: Curves.easeInOut,
    ));

    if (widget.status.toLowerCase() == 'waiting') {
      _pulseController.repeat(reverse: true);
      _shimmerController.repeat();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  Color _getStatusColor() {
    switch (widget.status.toLowerCase()) {
      case 'called':
        return AppTheme.primaryColor;
      case 'waiting':
        return AppTheme.warningColor;
      case 'serving':
        return AppTheme.successColor;
      case 'absent':
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWaiting = widget.status.toLowerCase() == 'waiting';
    final statusColor = _getStatusColor();

    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: isWaiting ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
        builder: (context, child) {
          return Transform.scale(
            scale: isWaiting ? _pulseAnimation.value : 1.0,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.cardColor,
                borderRadius: BorderRadius.circular(AppTheme.borderRadiusLarge),
                boxShadow: AppTheme.cardShadow,
                border: isWaiting
                    ? Border.all(
                        color: statusColor.withOpacity(0.3),
                        width: 1,
                      )
                    : null,
              ),
              child: Stack(
                children: [
                  // Shimmer effect for waiting tickets
                  if (isWaiting)
                    AnimatedBuilder(
                      animation: _shimmerAnimation,
                      builder: (context, child) {
                        return Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppTheme.borderRadiusLarge),
                            gradient: LinearGradient(
                              begin: Alignment(-1.0 + _shimmerAnimation.value, 0),
                              end: Alignment(1.0 + _shimmerAnimation.value, 0),
                              colors: [
                                Colors.transparent,
                                statusColor.withOpacity(0.1),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  
                  // Content
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header with ticket number and status
                        Row(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: statusColor,
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Ticket ${widget.ticketNumber}',
                                style: AppTheme.title3.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (isWaiting)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SizedBox(
                                      width: 8,
                                      height: 8,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'En attente',
                                      style: AppTheme.caption1.copyWith(
                                        color: statusColor,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Service name
                        if (widget.serviceName != null) ...[
                          Text(
                            widget.serviceName!,
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        
                        // Details
                        Row(
                          children: [
                            if (widget.position != null) ...[
                              _buildDetailChip(
                                icon: CupertinoIcons.list_number,
                                label: 'Position ${widget.position}',
                                color: isWaiting ? statusColor : AppTheme.textSecondary,
                              ),
                              const SizedBox(width: 8),
                            ],
                            if (widget.etaMinutes != null)
                              _buildDetailChip(
                                icon: CupertinoIcons.time,
                                label: '${widget.etaMinutes} min',
                                color: isWaiting ? statusColor : AppTheme.textSecondary,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTheme.caption1.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget d'animation de progression de file
class QueueProgressIndicator extends StatefulWidget {
  final int currentPosition;
  final int totalAhead;
  final Color? color;

  const QueueProgressIndicator({
    super.key,
    required this.currentPosition,
    required this.totalAhead,
    this.color,
  });

  @override
  State<QueueProgressIndicator> createState() => _QueueProgressIndicatorState();
}

class _QueueProgressIndicatorState extends State<QueueProgressIndicator>
    with TickerProviderStateMixin {
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _progressAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _progressController,
      curve: Curves.easeOutCubic,
    ));
    _progressController.forward();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? AppTheme.primaryColor;
    final progress = widget.totalAhead > 0 
        ? (widget.totalAhead - widget.currentPosition + 1) / widget.totalAhead
        : 1.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(AppTheme.borderRadiusMedium),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progression',
                style: AppTheme.callout.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                '${widget.currentPosition} personne${widget.currentPosition > 1 ? 's' : ''} devant vous',
                style: AppTheme.footnote.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AnimatedBuilder(
            animation: _progressAnimation,
            builder: (context, child) {
              return Container(
                height: 8,
                decoration: BoxDecoration(
                  color: AppTheme.backgroundColor,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progress * _progressAnimation.value,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          color.withOpacity(0.8),
                          color,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
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
