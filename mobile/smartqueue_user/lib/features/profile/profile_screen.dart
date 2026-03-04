import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'profile_provider.dart';
import 'notification_preferences_provider.dart';
import '../auth/auth_repository.dart';
import '../../core/app_router.dart';

/// Profil utilisateur (mock UI)
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncUser = ref.watch(currentUserProvider);
    final prefsAsync = ref.watch(notificationPreferencesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: asyncUser.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur: $e')),
        data: (user) {
          final name = user?.name ?? 'Utilisateur';
          final email = user?.email ?? 'non connecté';
          final initials = (name.isNotEmpty ? name[0] : 'U').toUpperCase();
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      child: Text(initials, style: Theme.of(context).textTheme.titleLarge),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text(email, style: const TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Text('Préférences', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (user == null)
                  const Text('Connectez-vous pour configurer vos notifications.')
                else
                  prefsAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: LinearProgressIndicator(),
                    ),
                    error: (e, _) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text('Erreur préférences: $e'),
                    ),
                    data: (prefs) {
                      return Column(
                        children: [
                          SwitchListTile(
                            value: prefs.pushEnabled,
                            onChanged: (v) => ref.read(notificationPreferencesProvider.notifier).setPushEnabled(v),
                            title: const Text('Notifications push'),
                            subtitle: const Text('Recevoir des alertes sur l’avancée de la file'),
                          ),
                          SwitchListTile(
                            value: prefs.smsEnabled,
                            onChanged: (v) => ref.read(notificationPreferencesProvider.notifier).setSmsEnabled(v),
                            title: const Text('Notifications SMS'),
                            subtitle: const Text('Recevoir un SMS quand votre tour approche'),
                          ),
                          const SizedBox(height: 8),
                          ListTile(
                            title: const Text('Alerter quand la position ≤'),
                            trailing: DropdownButton<int>(
                              value: prefs.notifyBeforePositions,
                              items: const [0, 1, 2, 3, 4, 5, 10]
                                  .map((v) => DropdownMenuItem(value: v, child: Text('$v')))
                                  .toList(),
                              onChanged: (v) {
                                if (v != null) {
                                  ref.read(notificationPreferencesProvider.notifier).setNotifyBeforePositions(v);
                                }
                              },
                            ),
                          ),
                          ListTile(
                            title: const Text('Alerter quand ETA ≤ (minutes)'),
                            trailing: DropdownButton<int>(
                              value: prefs.notifyBeforeMinutes,
                              items: const [0, 3, 5, 10, 15, 20, 30]
                                  .map((v) => DropdownMenuItem(value: v, child: Text('$v')))
                                  .toList(),
                              onChanged: (v) {
                                if (v != null) {
                                  ref.read(notificationPreferencesProvider.notifier).setNotifyBeforeMinutes(v);
                                }
                              },
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: user == null
                            ? () => Navigator.pushReplacementNamed(context, AppRouter.login)
                            : () async {
                                final repo = await AuthRepository.create();
                                await repo.logout();
                                if (context.mounted) {
                                  Navigator.pushNamedAndRemoveUntil(context, AppRouter.login, (_) => false);
                                }
                              },
                        child: Text(user == null ? 'Se connecter' : 'Se déconnecter'),
                      ),
                    ),
                  ],
                )
              ],
            ),
          );
        },
      ),
    );
  }
}
