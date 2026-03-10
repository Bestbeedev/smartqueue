import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../app_theme.dart';

export 'cupertino_bottom_nav.dart';


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
    final radius = BorderRadius.circular(AppTheme.borderRadiusMedium);

    return Container(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        boxShadow: AppTheme.cardShadow,
        borderRadius: radius,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: radius,
        child: Ink(
          decoration: BoxDecoration(
            color: color ?? AppTheme.cardColor,
            borderRadius: radius,
          ),
          child: onTap == null
              ? Padding(
                  padding: padding ?? const EdgeInsets.all(16),
                  child: child,
                )
              : InkWell(
                  onTap: onTap,
                  borderRadius: radius,
                  child: Padding(
                    padding: padding ?? const EdgeInsets.all(16),
                    child: child,
                  ),
                ),
        ),
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
                      style: AppTheme.callout,
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
        color: AppTheme.cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                icon: CupertinoIcons.home,
                label: 'Home',
                isActive: currentIndex == 0,
                onTap: () => onTap(0),
              ),
              _buildNavItem(
                icon: CupertinoIcons.list_bullet,
                label: 'Queues',
                isActive: currentIndex == 1,
                onTap: () => onTap(1),
              ),
              _buildNavItem(
                icon: CupertinoIcons.ticket,
                label: 'Billets',
                isActive: currentIndex == 2,
                onTap: () => onTap(2),
              ),
              _buildNavItem(
                icon: CupertinoIcons.bell,
                label: 'Notifications',
                isActive: currentIndex == 3,
                onTap: () => onTap(3),
              ),
              _buildNavItem(
                icon: CupertinoIcons.person,
                label: 'Profile',
                isActive: currentIndex == 4,
                onTap: () => onTap(4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 22,
            color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTheme.caption1.copyWith(
              color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}
