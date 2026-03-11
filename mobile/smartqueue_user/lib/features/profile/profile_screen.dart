import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../../core/app_router.dart';
import 'profile_provider.dart';
import 'notification_preferences_provider.dart';
import '../auth/auth_repository.dart';

/// Profile Screen with settings and logout
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
          // Header with iOS style
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 20,
                right: 20,
                bottom: 24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Profile',
                    style: AppTheme.title1.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Manage your account and preferences',
                    style: AppTheme.callout.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          asyncUser.when(
            loading: () => SliverFillRemaining(
              child: Center(child: CupertinoActivityIndicator()),
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
                      'Loading error',
                      style: AppTheme.title3.copyWith(
                        color: AppTheme.errorColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            data: (user) {
              final name = user?.name ?? 'Josué';
              final email = user?.email ?? 'josue@example.com';
              final initials = name.isNotEmpty ? name[0].toUpperCase() : 'J';

              return SliverList(
                delegate: SliverChildListDelegate([
                  // Profile card with improved design
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: CupertinoCard(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          // Avatar with shadow
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(35),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryColor.withOpacity(0.4),
                                  blurRadius: 15,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                initials,
                                style: AppTheme.title1.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 28,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          // User info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: AppTheme.title2.copyWith(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 20,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  email,
                                  style: AppTheme.callout.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.successColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppTheme.successColor.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Text(
                                    'Active Member',
                                    style: AppTheme.caption1.copyWith(
                                      color: AppTheme.successColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Settings section header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Icon(
                          CupertinoIcons.bell,
                          size: 20,
                          color: AppTheme.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Notifications',
                          style: AppTheme.headline.copyWith(
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Notification preferences
                  if (user != null) ...[
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: CupertinoCard(
                        padding: const EdgeInsets.all(4),
                        child: prefsAsync.when(
                          loading: () => Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                const CupertinoActivityIndicator(),
                                const SizedBox(width: 16),
                                Text(
                                  'Loading preferences...',
                                  style: AppTheme.callout.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          error: (error, _) => Padding(
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
                                    'Error: $error',
                                    style: AppTheme.callout.copyWith(
                                      color: AppTheme.errorColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          data: (prefs) => Column(
                            children: [
                              // Push notifications
                              _buildSettingTile(
                                icon: CupertinoIcons.bell,
                                iconColor: AppTheme.primaryColor,
                                title: 'Push Notifications',
                                subtitle: 'Receive alerts about queue progress',
                                trailing: CupertinoSwitch(
                                  value: prefs.pushEnabled,
                                  onChanged: (value) {
                                    ref
                                        .read(notificationPreferencesProvider
                                            .notifier)
                                        .setPushEnabled(value);
                                  },
                                ),
                              ),

                              // SMS notifications
                              _buildSettingTile(
                                icon: CupertinoIcons.phone,
                                iconColor: AppTheme.successColor,
                                title: 'SMS Notifications',
                                subtitle:
                                    'Receive SMS when your turn approaches',
                                trailing: CupertinoSwitch(
                                  value: prefs.smsEnabled,
                                  onChanged: (value) {
                                    ref
                                        .read(notificationPreferencesProvider
                                            .notifier)
                                        .setSmsEnabled(value);
                                  },
                                ),
                              ),

                              // Position alert
                              _buildSettingTile(
                                icon: CupertinoIcons.list_number,
                                iconColor: AppTheme.warningColor,
                                title: 'Alert when position ≤',
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.backgroundColor,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: AppTheme.dividerColor
                                          .withOpacity(0.3),
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
                                        ref
                                            .read(
                                                notificationPreferencesProvider
                                                    .notifier)
                                            .setNotifyBeforePositions(value);
                                      }
                                    },
                                  ),
                                ),
                              ),

                              // Time alert
                              _buildSettingTile(
                                icon: CupertinoIcons.time,
                                iconColor: AppTheme.errorColor,
                                title: 'Alert when ETA ≤ (minutes)',
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.backgroundColor,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: AppTheme.dividerColor
                                          .withOpacity(0.3),
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
                                        ref
                                            .read(
                                                notificationPreferencesProvider
                                                    .notifier)
                                            .setNotifyBeforeMinutes(value);
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    // Not logged in message
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: CupertinoCard(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(
                              CupertinoIcons.person_crop_circle_badge_xmark,
                              size: 48,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Sign In',
                              style: AppTheme.title3,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Sign in to configure notification preferences and access all features.',
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

                  const SizedBox(height: 28),

                  // Other settings header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Icon(
                          CupertinoIcons.gear,
                          size: 20,
                          color: AppTheme.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Settings',
                          style: AppTheme.headline.copyWith(
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: CupertinoCard(
                      padding: const EdgeInsets.all(4),
                      child: Column(
                        children: [
                          _buildSettingTile(
                            icon: CupertinoIcons.globe,
                            iconColor: AppTheme.secondaryColor,
                            title: 'Language',
                            trailing: const Icon(
                              CupertinoIcons.chevron_forward,
                              size: 16,
                              color: AppTheme.textSecondary,
                            ),
                            onTap: () {
                              // TODO: Implement language selection
                            },
                          ),
                          _buildSettingTile(
                            icon: CupertinoIcons.moon,
                            iconColor: AppTheme.warningColor,
                            title: 'Theme',
                            subtitle: 'Light',
                            trailing: const Icon(
                              CupertinoIcons.chevron_forward,
                              size: 16,
                              color: AppTheme.textSecondary,
                            ),
                            onTap: () {
                              // TODO: Implémenter le switch thème clair/sombre
                            },
                          ),
                          _buildSettingTile(
                            icon: CupertinoIcons.doc_text,
                            iconColor: AppTheme.textSecondary,
                            title: 'Terms of Service',
                            trailing: const Icon(
                              CupertinoIcons.chevron_forward,
                              size: 16,
                              color: AppTheme.textSecondary,
                            ),
                            onTap: () {
                              // TODO: Implement terms of service
                            },
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Logout/Login button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: user == null
                        ? CupertinoButtonCustom(
                            onPressed: () => Navigator.pushReplacementNamed(
                                context, AppRouter.login),
                            filled: true,
                            child: const Text('Sign In'),
                          )
                        : Column(
                            children: [
                              CupertinoButtonCustom(
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
                                child: Text(
                                  'Sign Out',
                                  style: AppTheme.button.copyWith(
                                    color: AppTheme.errorColor,
                                  ),
                                ),
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

  Widget _buildSettingTile({
    required IconData icon,
    Color? iconColor,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return CupertinoButton(
      padding: EdgeInsets.zero,
      onPressed: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: AppTheme.dividerColor.withOpacity(0.3),
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: iconColor ?? AppTheme.primaryColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTheme.body.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTheme.caption1.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) trailing,
          ],
        ),
      ),
    );
  }
}
