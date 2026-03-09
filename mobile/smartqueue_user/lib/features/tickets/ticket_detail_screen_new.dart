import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart' as sq_cupertino;
import '../../data/models/ticket.dart';

/// Écran de détail du ticket avec design iOS Cupertino
class TicketDetailScreen extends ConsumerStatefulWidget {
  final int ticketId;
  final String? serviceName;
  final Ticket? initialTicket;

  const TicketDetailScreen({
    super.key,
    required this.ticketId,
    this.serviceName,
    this.initialTicket,
  });

  @override
  ConsumerState<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends ConsumerState<TicketDetailScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _slideController;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    _pulseController.repeat(reverse: true);

    _slideController = AnimationController(
      duration: AppTheme.defaultAnimationDuration,
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: AppTheme.defaultAnimationCurve,
    ));
    _slideController.forward();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
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

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'called':
        return 'Appelé';
      case 'waiting':
        return 'En attente';
      case 'serving':
        return 'En service';
      case 'absent':
        return 'Absent';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Pour l'instant, utiliser le ticket initial
    // TODO: Implémenter la logique de récupération en temps réel
    final ticket = widget.initialTicket;

    if (ticket == null) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: sq_cupertino.CupertinoNavigationBar(
          title: 'Détail du ticket',
          onBackPressed: () => Navigator.pop(context),
        ),
        body: const Center(
          child: Text('Ticket non trouvé'),
        ),
      );
    }

    final statusColor = _getStatusColor(ticket.status);
    final isWaiting = ticket.status.toLowerCase() == 'waiting';

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
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: () => Navigator.pop(context),
                    child: Icon(
                      CupertinoIcons.back,
                      color: AppTheme.primaryColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Détail du ticket',
                      style: AppTheme.title2,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(width: 32), // Balance for back button
                ],
              ),
            ),
          ),

          // Contenu principal
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Carte principale du ticket
                SlideTransition(
                  position: _slideAnimation,
                  child: AnimatedBuilder(
                    animation: isWaiting
                        ? _pulseAnimation
                        : const AlwaysStoppedAnimation(1.0),
                    builder: (context, child) {
                      return Transform.scale(
                        scale: isWaiting ? _pulseAnimation.value : 1.0,
                        child: sq_cupertino.CupertinoCard(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              // Numéro du ticket
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  gradient: AppTheme.primaryGradient,
                                  borderRadius: BorderRadius.circular(
                                      AppTheme.borderRadiusLarge),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.primaryColor
                                          .withOpacity(0.3),
                                      blurRadius: 20,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      'Ticket',
                                      style: AppTheme.callout.copyWith(
                                        color: Colors.white.withOpacity(0.9),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      ticket.ticketNumber,
                                      style: AppTheme.largeTitle.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 24),

                              // Statut
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: statusColor,
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  _getStatusText(ticket.status),
                                  style: AppTheme.headline.copyWith(
                                    color: statusColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),

                // Informations détaillées
                if (ticket.serviceName != null) ...[
                  _buildInfoCard(
                    icon: CupertinoIcons.bag,
                    title: 'Service',
                    value: ticket.serviceName!,
                  ),
                  const SizedBox(height: 16),
                ],

                if (ticket.position != null) ...[
                  _buildInfoCard(
                    icon: CupertinoIcons.list_number,
                    title: 'Position dans la file',
                    value: '${ticket.position}',
                    valueColor: isWaiting ? AppTheme.primaryColor : null,
                  ),
                  const SizedBox(height: 16),
                ],

                if (ticket.etaMinutes != null) ...[
                  _buildInfoCard(
                    icon: CupertinoIcons.time,
                    title: 'Temps d\'attente estimé',
                    value: '${ticket.etaMinutes} minutes',
                    valueColor: isWaiting ? AppTheme.warningColor : null,
                  ),
                  const SizedBox(height: 16),
                ],

                // Actions
                if (isWaiting) ...[
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      Expanded(
                        child: sq_cupertino.CupertinoButtonCustom(
                          onPressed: () {
                            // TODO: Implémenter l'annulation
                            _showCancelConfirmation();
                          },
                          filled: false,
                          child: const Text('Annuler le ticket'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: sq_cupertino.CupertinoButtonCustom(
                          onPressed: () {
                            // TODO: Implémenter le partage
                            _shareTicket();
                          },
                          filled: true,
                          child: const Text('Partager'),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 32),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String value,
    Color? valueColor,
  }) {
    return sq_cupertino.CupertinoCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppTheme.borderRadiusMedium),
            ),
            child: Icon(
              icon,
              color: AppTheme.primaryColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.footnote.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTheme.callout.copyWith(
                    color: valueColor ?? AppTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCancelConfirmation() {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) {
        return CupertinoActionSheet(
          title: const Text('Annuler le ticket'),
          message: const Text('Êtes-vous sûr de vouloir annuler ce ticket ?'),
          actions: [
            CupertinoActionSheetAction(
              onPressed: () {
                Navigator.pop(context);
                // TODO: Implémenter l'annulation
                _cancelTicket();
              },
              isDestructiveAction: true,
              child: const Text('Annuler le ticket'),
            ),
          ],
          cancelButton: CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Retour'),
          ),
        );
      },
    );
  }

  void _cancelTicket() {
    // TODO: Implémenter la logique d'annulation
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Ticket annulé'),
        backgroundColor: AppTheme.errorColor,
      ),
    );
    Navigator.pop(context);
  }

  void _shareTicket() {
    // TODO: Implémenter le partage
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Fonction de partage bientôt disponible'),
      ),
    );
  }
}
