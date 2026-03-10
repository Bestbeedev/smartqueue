// features/home/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart' as sq;
import '../establishments/establishments_provider.dart';
import '../profile/profile_provider.dart';
import '../tickets/active_tickets_provider.dart';
import '../../core/app_router.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  final _nearbyKey = GlobalKey();

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

  void _selectCategory(String? category) {
    ref.read(selectedEstablishmentCategoryProvider.notifier).set(category);
    ref.invalidate(nearbyEstablishmentsProvider);
    Future.delayed(const Duration(milliseconds: 150), () {
      final ctx = _nearbyKey.currentContext;
      if (ctx != null) {
        Scrollable.ensureVisible(
          ctx,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
          alignment: 0.1,
        );
      }
    });
  }

  Widget _serviceItem({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return sq.CupertinoCard(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: AppTheme.caption1.copyWith(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader({
    required String title,
    String? actionText,
    VoidCallback? onAction,
  }) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: AppTheme.headline.copyWith(
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        if (actionText != null)
          CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: onAction,
            child: Text(
              actionText,
              style: AppTheme.callout.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }

  Widget _statusChip({required String status}) {
    Color c;
    String t;
    switch (status) {
      case 'waiting':
        c = AppTheme.warningColor;
        t = 'En attente';
        break;
      case 'called':
        c = AppTheme.successColor;
        t = 'Appelé';
        break;
      case 'served':
        c = Colors.grey;
        t = 'Terminé';
        break;
      case 'cancelled':
        c = AppTheme.errorColor;
        t = 'Annulé';
        break;
      default:
        c = AppTheme.textSecondary;
        t = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.withValues(alpha: 0.25)),
      ),
      child: Text(
        t,
        style: AppTheme.caption1.copyWith(
          color: c,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _activeTicketMiniCard(BuildContext context, dynamic ticket) {
    return SizedBox(
      width: 220,
      child: sq.CupertinoCard(
        onTap: () {
          AppRouter.navigatorKey.currentState?.pushNamed(
            AppRouter.realtime,
            arguments: {
              'ticketId': ticket.id,
              'serviceName': ticket.service?.name ?? 'Service',
              'ticket': ticket,
            },
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    ticket.service?.name ?? 'Service',
                    style: AppTheme.callout.copyWith(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                _statusChip(status: ticket.status),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              '#${ticket.ticketNumber}',
              style: AppTheme.title2.copyWith(
                fontWeight: FontWeight.w900,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                if (ticket.position != null) ...[
                  const Icon(
                    CupertinoIcons.person_2,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${ticket.position}ᵉ',
                    style: AppTheme.caption1.copyWith(
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const Spacer(),
                if (ticket.etaMinutes != null) ...[
                  const Icon(
                    CupertinoIcons.time,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '~${ticket.etaMinutes} min',
                    style: AppTheme.caption1.copyWith(
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _iconCircle({
    required Color color,
    required IconData icon,
  }) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncNearby = ref.watch(nearbyEstablishmentsProvider);
    final asyncUser = ref.watch(currentUserProvider);
    final asyncActiveTickets = ref.watch(activeTicketsProvider);
    final selectedCategory = ref.watch(selectedEstablishmentCategoryProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(nearbyEstablishmentsProvider);
          await ref.read(nearbyEstablishmentsProvider.future);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
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
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Bonjour ${asyncUser.when(
                              data: (user) => user?.name ?? 'Utilisateur',
                              loading: () => '...',
                              error: (_, __) => 'Utilisateur',
                            )}',
                            style: AppTheme.title1.copyWith(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 12),
                        CupertinoButton(
                          padding: EdgeInsets.zero,
                          onPressed: () {
                            AppRouter.navigatorKey.currentState
                                ?.pushNamed(AppRouter.notifications);
                          },
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceColor,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: AppTheme.dividerColor.withOpacity(0.25),
                              ),
                            ),
                            child: const Icon(
                              CupertinoIcons.bell,
                              color: AppTheme.textPrimary,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Search bar
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceColor,
                        borderRadius: BorderRadius.circular(16),
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
                          hintText: 'Rechercher un centre, clinique ou service',
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

                    // Shortcuts (Map / IA / Scanner)
                    Row(
                      children: [
                        Expanded(
                          child: sq.CupertinoCard(
                            onTap: () {
                              AppRouter.navigatorKey.currentState
                                  ?.pushNamed(AppRouter.liveMap);
                            },
                            child: Row(
                              children: [
                                _iconCircle(
                                  color: AppTheme.primaryColor,
                                  icon: CupertinoIcons.location,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Carte',
                                    style: AppTheme.headline.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: sq.CupertinoCard(
                            onTap: () {
                              AppRouter.navigatorKey.currentState
                                  ?.pushNamed(AppRouter.predictiveWaiting);
                            },
                            child: Row(
                              children: [
                                _iconCircle(
                                  color: AppTheme.warningColor,
                                  icon: CupertinoIcons.chart_bar,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'IA',
                                    style: AppTheme.headline.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: sq.CupertinoCard(
                            onTap: () {
                              AppRouter.navigatorKey.currentState
                                  ?.pushNamed(AppRouter.qr);
                            },
                            child: Row(
                              children: [
                                _iconCircle(
                                  color: AppTheme.successColor,
                                  icon: CupertinoIcons.qrcode_viewfinder,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'QR',
                                    style: AppTheme.headline.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    _sectionHeader(title: 'Services'),
                    const SizedBox(height: 12),
                    LayoutBuilder(
                      builder: (context, c) {
                        final w = c.maxWidth;
                        final cols = w >= 520 ? 4 : 3;
                        return GridView.count(
                          crossAxisCount: cols,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          childAspectRatio: 1.1,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          children: [
                            _serviceItem(
                              label: 'Banque',
                              icon: CupertinoIcons.money_dollar_circle,
                              color: AppTheme.primaryColor,
                              onTap: () => _selectCategory('banking'),
                            ),
                            _serviceItem(
                              label: 'Santé',
                              icon: CupertinoIcons.heart,
                              color: AppTheme.errorColor,
                              onTap: () => _selectCategory('health'),
                            ),
                            _serviceItem(
                              label: 'Public',
                              icon: CupertinoIcons.building_2_fill,
                              color: AppTheme.secondaryColor,
                              onTap: () => _selectCategory('public'),
                            ),
                            _serviceItem(
                              label: 'Social',
                              icon: CupertinoIcons.person_2_fill,
                              color: AppTheme.successColor,
                              onTap: () => _selectCategory('social'),
                            ),
                            _serviceItem(
                              label: 'Carte',
                              icon: CupertinoIcons.location,
                              color: AppTheme.primaryColor,
                              onTap: () {
                                AppRouter.navigatorKey.currentState
                                    ?.pushNamed(AppRouter.liveMap);
                              },
                            ),
                            _serviceItem(
                              label: 'IA',
                              icon: CupertinoIcons.chart_bar,
                              color: AppTheme.warningColor,
                              onTap: () {
                                AppRouter.navigatorKey.currentState
                                    ?.pushNamed(AppRouter.predictiveWaiting);
                              },
                            ),
                            _serviceItem(
                              label: 'Scanner',
                              icon: CupertinoIcons.qrcode_viewfinder,
                              color: AppTheme.successColor,
                              onTap: () {
                                AppRouter.navigatorKey.currentState
                                    ?.pushNamed(AppRouter.qr);
                              },
                            ),
                            _serviceItem(
                              label: 'Tous',
                              icon: CupertinoIcons.square_grid_2x2,
                              color: AppTheme.textSecondary,
                              onTap: () => _selectCategory(null),
                            ),
                          ],
                        );
                      },
                    ),

                    _sectionHeader(
                      title: 'Tickets actifs',
                      actionText: 'Voir tout',
                      onAction: () {
                        // Onglet Billets: on reste compatible avec l'archi existante.
                        AppRouter.navigatorKey.currentState
                            ?.pushNamed(AppRouter.myTickets);
                      },
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 140,
                      child: asyncActiveTickets.when(
                        loading: () => const Center(
                          child: CupertinoActivityIndicator(),
                        ),
                        error: (_, __) => Center(
                          child: Text(
                            'Impossible de charger vos tickets.',
                            style: AppTheme.callout.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ),
                        data: (tickets) {
                          if (tickets.isEmpty) {
                            return sq.CupertinoCard(
                              child: Row(
                                children: [
                                  _iconCircle(
                                    color: AppTheme.textSecondary,
                                    icon: CupertinoIcons.ticket,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Aucun ticket actif',
                                      style: AppTheme.callout.copyWith(
                                        color: AppTheme.textSecondary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          return ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.only(right: 8),
                            itemBuilder: (context, i) =>
                                _activeTicketMiniCard(context, tickets[i]),
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 12),
                            itemCount: tickets.length,
                          );
                        },
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
                      sq.CupertinoButtonCustom(
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
                            sq.CupertinoButtonCustom(
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
                            sq.CupertinoButtonCustom(
                              onPressed: () => ref.refresh(nearbyEstablishmentsProvider),
                              filled: true,
                              child: const Text('Autoriser'),
                            ),

                            if (nearby.status == NearbyEstablishmentsStatus.permissionDeniedForever) ...[
                              const SizedBox(height: 12),
                              sq.CupertinoButtonCustom(
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
                          const SizedBox(height: 8),
                          const CupertinoActivityIndicator(),
                          const SizedBox(height: 8),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 32.0),
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
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index == 0) {
                          return Padding(
                            key: _nearbyKey,
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _sectionHeader(
                                  title: 'À proximité',
                                  actionText: 'Voir tout',
                                  onAction: () {
                                    AppRouter.navigatorKey.currentState
                                        ?.pushNamed(
                                      AppRouter.establishmentsList,
                                      arguments: {
                                        'category': selectedCategory,
                                      },
                                    );
                                  },
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
                                        onPressed: () => _selectCategory(null),
                                        child: Container(
                                          width: 32,
                                          height: 32,
                                          decoration: BoxDecoration(
                                            color: AppTheme.surfaceColor,
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(
                                              color: AppTheme.dividerColor.withOpacity(0.25),
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
                              ],
                            ),
                          );
                        }

                        final establishment =
                            filteredEstablishments[index - 1];

                        final showDivider =
                            index != filteredEstablishments.length;
                        final isFirstItem = index == 1;
                        final isLastItem = index == filteredEstablishments.length;

                        return Padding(
                          padding: EdgeInsets.only(
                            top: isFirstItem ? 0 : 0,
                            bottom: isLastItem ? 8 : 0,
                          ),
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: AppTheme.dividerColor.withOpacity(0.18),
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Column(
                                children: [
                                  sq.CupertinoListTile(
                                    onTap: () {
                                      AppRouter.navigatorKey.currentState
                                          ?.pushNamed(
                                        AppRouter.establishmentDetail,
                                        arguments: {
                                          'establishmentId': establishment.id,
                                        },
                                      );
                                    },
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 12,
                                    ),
                                    leading: Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryColor
                                            .withValues(alpha: 0.25),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    title: Text(
                                      establishment.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTheme.body.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    subtitle: Text(
                                      establishment.address ?? '',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTheme.callout.copyWith(
                                        color: AppTheme.textSecondary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    trailing: const Icon(
                                      CupertinoIcons.chevron_forward,
                                      size: 18,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                  if (showDivider)
                                    Padding(
                                      padding: const EdgeInsets.only(left: 44),
                                      child: Container(
                                        height: 0.5,
                                        color: AppTheme.dividerColor
                                            .withOpacity(0.28),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                      childCount: filteredEstablishments.length + 1,
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
