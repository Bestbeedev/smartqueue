import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../app_theme.dart';

/// Bottom navigation bar style iOS Cupertino
class CupertinoBottomNavigationBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const CupertinoBottomNavigationBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.tabBarColor,
        border: Border(
          top: BorderSide(
            color: AppTheme.dividerColor.withOpacity(0.3),
            width: 0.5,
          ),
        ),
        boxShadow: AppTheme.navigationShadow,
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildTabItem(
                icon: CupertinoIcons.house,
                activeIcon: CupertinoIcons.house_fill,
                label: 'Home',
                index: 0,
              ),
              _buildTabItem(
                icon: CupertinoIcons.list_bullet,
                activeIcon: CupertinoIcons.list_bullet,
                label: 'Queues',
                index: 1,
              ),
              _buildTabItem(
                icon: CupertinoIcons.ticket,
                activeIcon: CupertinoIcons.ticket_fill,
                label: 'Ticket',
                index: 2,
              ),
              _buildTabItem(
                icon: CupertinoIcons.bell,
                activeIcon: CupertinoIcons.bell_fill,
                label: 'Notifications',
                index: 3,
              ),
              _buildTabItem(
                icon: CupertinoIcons.person,
                activeIcon: CupertinoIcons.person_fill,
                label: 'Profile',
                index: 4,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
  }) {
    final isActive = currentIndex == index;

    return GestureDetector(
      onTap: () => onTap(index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              size: 24,
              color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTheme.caption1.copyWith(
                color:
                    isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Navigation bar style iOS Cupertino pour les app bars
class CupertinoNavigationBar extends StatelessWidget
    implements PreferredSizeWidget {
  final String? title;
  final List<Widget>? leading;
  final List<Widget>? trailing;
  final bool automaticallyImplyLeading;
  final VoidCallback? onBackPressed;

  const CupertinoNavigationBar({
    super.key,
    this.title,
    this.leading,
    this.trailing,
    this.automaticallyImplyLeading = true,
    this.onBackPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top,
        left: 16,
        right: 16,
        bottom: 8,
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
          if (leading != null) ...leading!,
          if (automaticallyImplyLeading && leading == null)
            CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: onBackPressed ?? () => Navigator.of(context).pop(),
              child: Icon(
                CupertinoIcons.back,
                color: AppTheme.primaryColor,
                size: 24,
              ),
            ),
          const Spacer(),
          if (title != null)
            Text(
              title!,
              style: AppTheme.headline,
              textAlign: TextAlign.center,
            ),
          const Spacer(),
          if (trailing != null) ...trailing!,
          if (trailing == null)
            const SizedBox(width: 44), // Balance for back button
        ],
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(
        kToolbarHeight + 16 + 8, // Extra padding for iOS style
      );
}

/// Button style iOS Cupertino
class CupertinoButtonCustom extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? textColor;
  final EdgeInsetsGeometry? padding;
  final bool filled;
  final bool minimal;

  const CupertinoButtonCustom({
    super.key,
    required this.child,
    this.onPressed,
    this.color,
    this.textColor,
    this.padding,
    this.filled = false,
    this.minimal = false,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoButton(
      onPressed: onPressed,
      color: filled ? (color ?? AppTheme.primaryColor) : null,
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: DefaultTextStyle(
        style: AppTheme.button.copyWith(
          color: textColor ?? (filled ? Colors.white : AppTheme.primaryColor),
        ),
        child: child,
      ),
    );
  }
}

/// Card style iOS Cupertino
class CupertinoCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final Color? color;

  const CupertinoCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin:
            margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color ?? AppTheme.cardColor,
          borderRadius: BorderRadius.circular(AppTheme.borderRadiusMedium),
          boxShadow: AppTheme.cardShadow,
        ),
        child: child,
      ),
    );
  }
}

/// List tile style iOS Cupertino
class CupertinoListTile extends StatelessWidget {
  final Widget? leading;
  final Widget? title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? contentPadding;

  const CupertinoListTile({
    super.key,
    this.leading,
    this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.contentPadding,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: contentPadding ??
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          border: Border(
            bottom: BorderSide(
              color: AppTheme.dividerColor.withOpacity(0.3),
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            if (leading != null) ...[
              leading!,
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (title != null)
                    DefaultTextStyle(
                      style: AppTheme.body,
                      child: title!,
                    ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    DefaultTextStyle(
                      style: AppTheme.footnote,
                      child: subtitle!,
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 12),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}
