import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart' as sq_cupertino;
import '../../core/app_router.dart';
import 'profile_provider.dart';
import 'notification_preferences_provider.dart';
import '../auth/auth_repository.dart';

/// Profil utilisateur avec design iOS Cupertino
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncUser = ref.watch(currentUserProvider);
    final prefsAsync = ref.watch(notificationPreferencesProvider);

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
                          'Profil',
                          style: AppTheme.largeTitle,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Gérez vos préférences',
                          style: AppTheme.subheadline.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Contenu principal
          asyncUser.when(
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
                  ],
                ),
              ),
            ),
            data: (user) {
              final name = user?.name ?? 'Utilisateur';
              final email = user?.email ?? 'non connecté';
              final initials = (name.isNotEmpty ? name[0] : 'U').toUpperCase();

              return SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 16),
                  
                  // Carte profil
                  sq_cupertino.CupertinoCard(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        // Avatar
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            gradient: AppTheme.primaryGradient,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryColor.withOpacity(0.3),
                                blurRadius: 15,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              initials,
                              style: AppTheme.title1.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Infos utilisateur
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: AppTheme.title3,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                email,
                                style: AppTheme.callout.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Edit button
                        if (user != null)
                          CupertinoButton(
                            padding: EdgeInsets.zero,
                            onPressed: () {
                              // TODO: Implémenter l'édition du profil
                            },
                            child: Icon(
                              CupertinoIcons.pencil,
                              color: AppTheme.primaryColor,
                              size: 20,
                            ),
                          ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Section Préférences
                  if (user != null) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Préférences de notification',
                        style: AppTheme.title3,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    prefsAsync.when(
                      loading: () => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: sq_cupertino.CupertinoCard(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              const CupertinoActivityIndicator(),
                              const SizedBox(width: 16),
                              Text(
                                'Chargement des préférences...',
                                style: AppTheme.callout.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      error: (error, _) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: sq_cupertino.CupertinoCard(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Icon(
                                CupertinoIcons.exclamationmark_triangle,
                                color: AppTheme.errorColor,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Erreur: $error',
                                  style: AppTheme.callout.copyWith(
                                    color: AppTheme.errorColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      data: (prefs) => Column(
                        children: [
                          // Notifications push
                          sq_cupertino.CupertinoListTile(
                            leading: Icon(
                              CupertinoIcons.bell,
                              color: AppTheme.primaryColor,
                            ),
                            title: const Text('Notifications push'),
                            subtitle: const Text('Recevoir des alertes sur l\'avancée de la file'),
                            trailing: CupertinoSwitch(
                              value: prefs.pushEnabled,
                              onChanged: (value) {
                                ref.read(notificationPreferencesProvider.notifier).setPushEnabled(value);
                              },
                            ),
                          ),
                          
                          // Notifications SMS
                          sq_cupertino.CupertinoListTile(
                            leading: Icon(
                              CupertinoIcons.phone,
                              color: AppTheme.primaryColor,
                            ),
                            title: const Text('Notifications SMS'),
                            subtitle: const Text('Recevoir un SMS quand votre tour approche'),
                            trailing: CupertinoSwitch(
                              value: prefs.smsEnabled,
                              onChanged: (value) {
                                ref.read(notificationPreferencesProvider.notifier).setSmsEnabled(value);
                              },
                            ),
                          ),

                          // Position alert
                          sq_cupertino.CupertinoListTile(
                            leading: Icon(
                              CupertinoIcons.list_number,
                              color: AppTheme.primaryColor,
                            ),
                            title: const Text('Alerter quand la position ≤'),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.backgroundColor,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppTheme.dividerColor.withOpacity(0.3),
                                ),
                              ),
                              child: DropdownButton<int>(
                                value: prefs.notifyBeforePositions,
                                underline: const SizedBox(),
                                isDense: true,
                                items: const [0, 1, 2, 3, 4, 5, 10]
                                    .map((v) => DropdownMenuItem(
                                          value: v,
                                          child: Text('$v'),
                                        ))
                                    .toList(),
                                onChanged: (value) {
                                  if (value != null) {
                                    ref.read(notificationPreferencesProvider.notifier).setNotifyBeforePositions(value);
                                  }
                                },
                              ),
                            ),
                          ),

                          // Time alert
                          sq_cupertino.CupertinoListTile(
                            leading: Icon(
                              CupertinoIcons.time,
                              color: AppTheme.primaryColor,
                            ),
                            title: const Text('Alerter quand ETA ≤ (minutes)'),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.backgroundColor,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppTheme.dividerColor.withOpacity(0.3),
                                ),
                              ),
                              child: DropdownButton<int>(
                                value: prefs.notifyBeforeMinutes,
                                underline: const SizedBox(),
                                isDense: true,
                                items: const [0, 3, 5, 10, 15, 20, 30]
                                    .map((v) => DropdownMenuItem(
                                          value: v,
                                          child: Text('$v'),
                                        ))
                                    .toList(),
                                onChanged: (value) {
                                  if (value != null) {
                                    ref.read(notificationPreferencesProvider.notifier).setNotifyBeforeMinutes(value);
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Message pour utilisateur non connecté
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: sq_cupertino.CupertinoCard(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Icon(
                              CupertinoIcons.person_crop_circle_badge_xmark,
                              size: 48,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Connectez-vous',
                              style: AppTheme.title3,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Connectez-vous pour configurer vos préférences de notification et accéder à toutes les fonctionnalités.',
                              style: AppTheme.callout.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Section Actions
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Actions',
                      style: AppTheme.title3,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Bouton connexion/déconnexion
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: user == null
                        ? sq_cupertino.CupertinoButtonCustom(
                            onPressed: () => Navigator.pushReplacementNamed(context, AppRouter.login),
                            filled: true,
                            child: const Text('Se connecter'),
                          )
                        : Column(
                            children: [
                              sq_cupertino.CupertinoButtonCustom(
                                onPressed: () async {
                                  final repo = await AuthRepository.create();
                                  await repo.logout();
                                  if (context.mounted) {
                                    Navigator.pushNamedAndRemoveUntil(
                                      context,
                                      AppRouter.login,
                                      (_) => false,
                                    );
                                  }
                                },
                                filled: false,
                                child: const Text('Se déconnecter'),
                              ),
                              const SizedBox(height: 12),
                              sq_cupertino.CupertinoButtonCustom(
                                onPressed: () {
                                  // TODO: Implémenter la suppression du compte
                                  _showDeleteAccountConfirmation();
                                },
                                filled: false,
                                textColor: AppTheme.errorColor,
                                child: const Text('Supprimer le compte'),
                              ),
                            ],
                          ),
                  ),

                  const SizedBox(height: 32),
                ]),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountConfirmation() {
    // TODO: Implémenter la confirmation de suppression
  }
}
