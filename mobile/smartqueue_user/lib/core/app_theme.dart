import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

class AppTheme {
  // Couleurs iOS Cupertino
  static const Color primaryColor = Color(0xFF007AFF); // Bleu iOS
  static const Color secondaryColor = Color(0xFF5856D6); // Violet iOS
  static const Color backgroundColor = Color(0xFFF2F2F7); // Gris iOS clair
  static const Color surfaceColor = Color(0xFFFFFFFF); // Blanc iOS
  static const Color cardColor = Color(0xFFFFFFFF); // Blanc pour cartes
  static const Color errorColor = Color(0xFFFF3B30); // Rouge iOS
  static const Color successColor = Color(0xFF34C759); // Vert iOS
  static const Color warningColor = Color(0xFFFF9500); // Orange iOS
  static const Color textPrimary = Color(0xFF000000); // Noir iOS
  static const Color textSecondary = Color(0xFF8E8E93); // Gris iOS secondaire
  static const Color dividerColor = Color(0xFFC6C6C8); // Gris iOS diviseur
  static const Color tabBarColor = Color(0xF9FFFFFF); // Blanc avec transparence
  static const Color navigationBarColor =
      Color(0xF9FFFFFF); // Blanc avec transparence

  // Dégradés iOS
  static LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryColor.withOpacity(0.9), primaryColor],
  );

  // Thème Cupertino iOS
  static ThemeData cupertinoTheme = ThemeData(
    useMaterial3: false,
    brightness: Brightness.light,
    primarySwatch: Colors.blue,
    scaffoldBackgroundColor: backgroundColor,
    appBarTheme: const AppBarTheme(
      elevation: 0,
      centerTitle: true,
      backgroundColor: navigationBarColor,
      foregroundColor: textPrimary,
      titleTextStyle: TextStyle(
        color: textPrimary,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
      ),
      iconTheme: IconThemeData(color: primaryColor),
      systemOverlayStyle: SystemUiOverlayStyle.dark,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: tabBarColor,
      selectedItemColor: primaryColor,
      unselectedItemColor: textSecondary,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      color: cardColor,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: dividerColor.withOpacity(0.3)),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.5,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor, width: 1),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.5,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.5,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surfaceColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: dividerColor.withOpacity(0.5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: dividerColor.withOpacity(0.5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor),
      ),
      labelStyle: const TextStyle(color: textSecondary, fontSize: 17),
      hintStyle: const TextStyle(color: textSecondary, fontSize: 17),
    ),
    listTileTheme: const ListTileThemeData(
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      titleTextStyle: TextStyle(
        color: textPrimary,
        fontSize: 17,
        fontWeight: FontWeight.w400,
      ),
      subtitleTextStyle: TextStyle(
        color: textSecondary,
        fontSize: 15,
        fontWeight: FontWeight.w400,
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: dividerColor,
      thickness: 0.5,
      space: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: surfaceColor,
      selectedColor: primaryColor.withOpacity(0.1),
      disabledColor: backgroundColor,
      labelStyle: const TextStyle(color: textPrimary),
      secondaryLabelStyle: const TextStyle(color: primaryColor),
      brightness: Brightness.light,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: dividerColor.withOpacity(0.3)),
      ),
    ),
  );

  // Thème clair (maintenant compatible avec iOS)
  static ThemeData lightTheme = cupertinoTheme;

  // Styles de texte iOS
  static const TextStyle largeTitle = TextStyle(
    fontSize: 34,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle title1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle title2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle title3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle headline = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle body = TextStyle(
    fontSize: 17,
    color: textPrimary,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.5,
  );

  static const TextStyle callout = TextStyle(
    fontSize: 16,
    color: textPrimary,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.5,
  );

  static const TextStyle subheadline = TextStyle(
    fontSize: 15,
    color: textPrimary,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.5,
  );

  static const TextStyle footnote = TextStyle(
    fontSize: 13,
    color: textSecondary,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.5,
  );

  static const TextStyle caption1 = TextStyle(
    fontSize: 12,
    color: textSecondary,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.5,
  );

  static const TextStyle caption2 = TextStyle(
    fontSize: 11,
    color: textSecondary,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.5,
  );

  // Alias pour compatibilité
  static const TextStyle heading1 = title2;
  static const TextStyle heading2 = title3;
  static const TextStyle bodyLarge = body;
  static const TextStyle bodyMedium = callout;
  static const TextStyle button = headline;

  // Espacements iOS
  static const double paddingXS = 4.0;
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingXL = 32.0;

  // Rayons des bordures iOS
  static const double borderRadiusSmall = 6.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;
  static const double borderRadiusXL = 24.0;

  // Ombres iOS (très légères)
  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.04),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
    BoxShadow(
      color: Colors.black.withOpacity(0.02),
      blurRadius: 1,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> navigationShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.08),
      blurRadius: 10,
      offset: const Offset(0, 1),
    ),
  ];

  // Animations iOS
  static const Duration defaultAnimationDuration = Duration(milliseconds: 250);
  static const Curve defaultAnimationCurve = Curves.easeOutCubic;
  static const Curve springAnimationCurve = Curves.elasticOut;

  // Composants Cupertino helpers
  static Widget cupertinoDivider({double height = 0.5}) {
    return Container(
      height: height,
      color: dividerColor,
    );
  }

  static Widget cupertinoCard({
    required Widget child,
    EdgeInsetsGeometry? margin,
    EdgeInsetsGeometry? padding,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(borderRadiusMedium),
        boxShadow: cardShadow,
      ),
      child: child,
    );
  }
}
